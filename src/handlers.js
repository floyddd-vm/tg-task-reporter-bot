import { getMenuKeyboard, REMARK_TYPE_LIST, LOCATION_LIST, START_MESSAGE,SKIP, LOGIN_MESSAGE, getListKayArray } from './constants.js';
import fs from 'fs';
import  { sendToBitrix24 }from './bitrix.js';
import { getUserById, addUser, setUserMenuLevel, updateUsername, setUserLoginFullName, setUserData, clearUserData, createTaskRecord, setTaskBitrixId } from "./db.js";
import { convertImageToBase64 } from './image.js';
import { convertDate } from './utils.js';



export async function handle(bot, msg) {
  const chatId = String(msg.chat.id);
  const username = msg.from.username;
  let user = await getUserById( chatId );
  if (!user) {
    user = await addUser( chatId, msg.from.username );
  } else if (user.username !== username) {
    await updateUsername(chatId, username);
  }

  if (msg.text === "/start") {
    await handleStart(bot, chatId, user);
    return;
  } else if (msg.text === "/login") {
    await handlelogin(bot, chatId);
    return;
  } else {
    await handleRemarkCreation(bot, chatId, msg, user);
  }
}

export async function handleStart(bot, chatId, user) {
  await bot.sendMessage(chatId, START_MESSAGE);

  if (user.login) {
    //переходим на первый шаг если пользователь уже авторизован
    await selectLocation(bot, chatId)
  }
}

export async function handlelogin(bot, chatId) {
  await bot.sendMessage(chatId, LOGIN_MESSAGE);
  //set menu level
  await setUserMenuLevel(chatId, 11);
}

export async function handleRemarkCreation(bot, chatId, msg, user) {
  switch (user.current_step) {
    case 1:
      await setLocation(bot, chatId, msg);
      break;
    case 11:
      await setlogin(bot, chatId, msg);
      break;
    case 2:
      await setAddress(bot, chatId, msg);
      break;
    case 3:
      await setRemarkType(bot, chatId, msg);
      break;
    case 4:
      await setCargoId(bot, chatId, msg);
      break;
    case 5:
      await setPhoto(bot, chatId, msg);
      break;
    case 6:
      await addTask(bot, chatId);
      break;
    default:
      
      break;
  }

}

async function selectLocation(bot, chatId) {
    await setUserMenuLevel(chatId, 1);
    await clearUserData(chatId);
    await bot.sendMessage(chatId, "Выберите площадку на которой хотите сделать замечание.", getMenuKeyboard(getListKayArray(LOCATION_LIST)));
}

async function setLocation(bot, chatId, msg) {
  const locationStr = msg.text;
  if(LOCATION_LIST[locationStr]) {
    const location = LOCATION_LIST[locationStr];
    await setUserData(chatId, { location });
    await writeAddress(bot, chatId);
  }else{
    bot.sendMessage(chatId, "Не удалось распознать площадку'");
    await selectLocation(bot, chatId)
  }
}

async function writeAddress(bot, chatId) {
  await setUserMenuLevel(chatId, 2);
  bot.sendMessage(chatId, "Введите адрес ячейки в формате ...'");
}

async function setAddress(bot, chatId, msg) {
  const addressStr = msg.text;
  //TODO: распознать адрес
  if(addressStr) {
    await setUserData(chatId, { address: addressStr });
    await selectRemarkType(bot, chatId);
  }else{
    bot.sendMessage(chatId, "Не удалось распознать адрес ячейки'");
    await writeAddress(bot, chatId)
  }
}

async function selectRemarkType(bot, chatId) {
  await setUserMenuLevel(chatId, 3);
    bot.sendMessage(chatId, "Выберите тип замечания", getMenuKeyboard(getListKayArray(REMARK_TYPE_LIST)));
}

async function setRemarkType(bot, chatId, msg) {
  const remarkTypeStr = msg.text;
  if(REMARK_TYPE_LIST[remarkTypeStr]) {
    const remarkType = REMARK_TYPE_LIST[remarkTypeStr];
    await setUserData(chatId, { remarkType });
    await writeCargoId(bot, chatId);
  }else{
    bot.sendMessage(chatId, "Не удалось распознать тип замечания'");
    await selectRemarkType(bot, chatId)
  }
}

async function writeCargoId(bot, chatId) {
  await setUserMenuLevel(chatId, 4);
  bot.sendMessage(chatId, "Введите ID груза в формате '1234567890'");
}

async function setCargoId(bot, chatId, msg) {
  const cargoIdStr = msg.text;
  //TODO: распознать ID груза
  if(cargoIdStr) {
    await setUserData(chatId, { cargoId: cargoIdStr });
    await sendPhoto(bot, chatId);
  }else{
    bot.sendMessage(chatId, "Не удалось распознать ID груза'");
    await writeCargoId(bot, chatId)
  }
}

async function sendPhoto(bot, chatId) {
  await setUserMenuLevel(chatId, 5);
  bot.sendMessage(chatId, `Пришлите фото или нажмите клавишу '${SKIP}'`, getMenuKeyboard([SKIP], true));
}

async function setPhoto(bot, chatId, msg) {
  const text = msg.text;
  let photoBase64 = undefined;
  const comment = msg.caption || msg.text;
  try{
    if( msg.photo) {
      const file_id  = (msg.photo[msg.photo.length-1].file_id);
      await bot.getFileLink(file_id).then( async (fileUri) => {
        photoBase64 = await convertImageToBase64(fileUri);
      });
    }

    await setUserData(chatId, { photoBase64, comment });
    await addTask(bot, chatId);
  }catch(error){
    console.log(error);
    bot.sendMessage(chatId, "Ошибка при распознавании фото'");
    await sendPhoto(bot, chatId)
  }
}

async function addTask(bot, chatId) {
  try {
    const user = await getUserById(chatId);
    const task = await createTaskRecord(chatId, user.data);

    const responseData = await sendToBitrix24(
      {
        creator: user.login,
        createdAt: task.created_at,
        location: task.location,
        address: task.address,
        remarkType: task.remark_type,
        cargoId: task.cargo_id,
        photoBase64: task.photo_base64,
        comment: task.comment,
      }
    );

    await setTaskBitrixId(task.id, responseData?.result?.item?.id);
    await bot.sendMessage(chatId, "Задача успешно добавлена");
  } catch (error) {
    console.log(error);
    await bot.sendMessage(chatId, "Ошибка при добавлении задачи");
  }

  await selectLocation(bot, chatId);
}


async function setlogin(bot, chatId, msg) {
  const staffStr = msg.text;
  const staffRegex = /^([A-Z0-9-]+)\s+(.+)$/;
  const staffMatch = staffStr.match(staffRegex);
  if (staffMatch) {
    const login = staffMatch[1];
    const fullName = staffMatch[2];
    console.log({ login, fullName });

    await setUserLoginFullName(chatId, login, fullName);
    await bot.sendMessage(chatId, "Вы успешно добавили информацию о себе.");
    //переходим на первый шаг
    await selectLocation(bot, chatId)
  } else {
    bot.sendMessage(chatId, "Неудалось распознать символ и имя сотрудника. Пожалуйста, введите их в формате 'EVM Ефремов Виктор Михайлович'");
  }
}


