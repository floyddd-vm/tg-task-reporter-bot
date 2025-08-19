export const START_MESSAGE = `
Добро пожаловать! Я бот, позволяющий сообщать 
о проблемах на складе.
Для продолжения работы представьтесь пожалуйста 
введите команду /login`;

export const LOGIN_MESSAGE = `
Введите свой логин и полное имя в формате: \`Login(Solvo) Имя Фамилия Отчетво\`.
Пример: \`ISM Иванов Сергей Михайлович\`
`;

export const SKIP = `Пропустить`;

///crm.item.fields?entityTypeId=1102
export const REMARK_TYPE_LIST ={
  "Груз поврежден":183,
  "Груз не числится в ячейке":184,
  "Товарное соседство":185,
}

export const LOCATION_LIST = {
    "М19": 227,
    "М70": 228,
    "УЗ": 229,
    "К8": 230,
    "ТАРА": 231,
}
//how conver LOCATION_LIST to kay array
export const getListKayArray = (data) => {
  return Object.keys(data).map(key => key);
}

export const getMenuKeyboard = (options, back = false) => {
  return {
    reply_markup: {
      // добавлять к кнопкам назад в главное меню
      keyboard: back ? 
        options.map(option => [{ text: option }]).concat([[{ text: 'Назад в главное меню' }]]) :
        options.map(option => [{ text: option }]),
      one_time_keyboard: true,
    },
  };
};


