const express = require('express');
const fetch = require('node-fetch');
const app = express();
const PORT = process.env.PORT || 3000;

// Ваши данные из Spotify Developer
const CLIENT_ID = '29eeefe2169144d8b7feee773072b1bd';
const CLIENT_SECRET = '8d27b07f376e4353a64e37a970147bf6';
const REFRESH_TOKEN = 'AQA4gVULjwxr2owHM-487NVM6leOe2ahgZIuyEpRo1c7WjNMp1FS4-kssjjOJecKFD9diDagvZiAdidm3LvQngbR7LG7BuFxYxOf_XA41OzANjZxJirXrNYpGvrGRdz9t7Y';

let currentAccessToken = '';

// Функция для обновления access_token
async function refreshAccessToken() {
    try {
        const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
             body: `grant_type=refresh_token&refresh_token=${REFRESH_TOKEN}&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}`
        });

        const data = await response.json();
        
        if (data.access_token) {
            currentAccessToken = data.access_token;
            console.log('Token обновлен:', new Date().toLocaleTimeString());
        } else {
            console.error('Ошибка обновления token:', data);
        }
    } catch (error) {
        console.error('Ошибка:', error);
    }
}

// Функция для получения текущего трека
async function getCurrentTrack() {
    if (!currentAccessToken) {
        await refreshAccessToken();
    }

    try {
        const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
            headers: {
                'Authorization': `Bearer ${currentAccessToken}`
            }
        });

        if (response.status === 200) {
            const data = await response.json();
            
            if (data && data.item) {
                const artist = data.item.artists[0].name;
                const track = data.item.name;
                return `${artist} - ${track}`;
            } else {
                return 'Сейчас ничего не играет';
            }
        } else if (response.status === 204) {
            return 'Сейчас ничего не играет';
        } else {
            // Если токен устарел, обновляем и пробуем снова
            await refreshAccessToken();
            return 'Попробуйте еще раз';
        }
    } catch (error) {
        console.error('Ошибка получения трека:', error);
        return 'Ошибка получения трека';
    }
}

// Маршрут для Nightbot
app.get('/current-track', async (req, res) => {
    const trackInfo = await getCurrentTrack();
    res.set('Content-Type', 'text/plain; charset=utf-8');
    res.send(trackInfo);
});

// Запуск сервера
app.listen(PORT, async () => {
    console.log(`Сервер запущен на порту ${PORT}`);
    // Первоначальное получение токена
    await refreshAccessToken();
    // Автообновление токена каждые 50 минут
    setInterval(refreshAccessToken, 50 * 60 * 1000);

});
