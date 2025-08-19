import axios from 'axios';


export const convertImageToBase64 = async (url) => {
        try {
            // Скачиваем изображение
            const response = await axios.get(url, { responseType: 'arraybuffer' });
            
            // Получаем бинарные данные изображения
            const imageBuffer = Buffer.from(response.data, 'binary');
    
            // Конвертируем в Base64
            const base64Image = imageBuffer.toString('base64');
    
            // Выводим строку Base64
            //console.log(base64Image);
            return base64Image;
        } catch (error) {
            console.error('Ошибка при скачивании изображения:', error);
        }
    }
