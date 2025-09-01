import axios from 'axios';
    
    export const getLocation = async (location) => {
        // Здесь происходит запрос к Битрикс24 для получения информации о местоположении
        const url = process.env.BITRIX24_WEBHOOK_URL + '/crm.item.get';
        const fields = {
            ufCrm14_1748522003062: location,
        };
        try {
            const response = await axios.post(url, {fields});
            console.log('Местоположение найдено', response.data);
            return response.data;
        } catch (error) {
            console.error('Ошибка при получении местоположения:', error);
        }
    };

    export const sendToBitrix24 = async ({creator, createdAt, location, address, remarkType, cargoId, photoBase64, comment}) => {
        // Здесь происходит отправка данных в Битрикс24
        const url = process.env.BITRIX24_WEBHOOK_URL + '/crm.item.add';
        //console.log({photoBase64});
        const fields = {
            ufCrm12_1750064691: creator,
            ufCrm12_1750062323: createdAt,
            ufCrm12_1755725092: location,
            ufCrm12_1750063963: address,
            ufCrm12_1750063717: remarkType,
            ufCrm12_1755724400: cargoId,
            ufCrm12_1750064030: photoBase64,
            ufCrm12_1750064110: comment,  
            
            createdBy: 225,
            assignedById: 225,
        };

        console.log({fields});
        const entityTypeId = 1102;
        const createdBy = 1;
        const assignedById = 183;
        try {
            const response = await axios.post(url, {fields, entityTypeId, createdBy, assignedById});
            console.log('Задача добавлена', response.data);
            return response.data;
        } catch (error) {
            console.error('Ошибка при добавлении задачи:', error);
        }
    };

    export const getTaskById = async (id) => {
        // Здесь происходит запрос к Битрикс24 для получения информации о задаче
        const url = process.env.BITRIX24_WEBHOOK_URL + '/crm.item.get';
        const fields = {
            id,
        };
        const entityTypeId = 1102;
        try {
            const response = await axios.post(url, {id, entityTypeId});
            console.log('Задача найдена', response.data);
            return response.data;
        } catch (error) {
            console.error('Ошибка при получении задачи:', error);
        }
    };
