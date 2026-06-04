const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

const CLIENT_ID = '29eeefe2169144d8b7feee773072b1bd';
const CLIENT_SECRET = '8d27b07f376e4353a64e37a970147bf6';
const REFRESH_TOKEN = 'AQARNlJ72jS1xEvvfTXfbp_12Zq47upafmT7C1cfYo8-V2GnLicDUBWqJ-9so2qf60Dl9enCtJdVwKGGfbhl6JifAH7wv7g2eLvaPwSLeHb-XhWBnvuzg9_cIBnWXItQ8bg';

let currentAccessToken = '';

async function refreshAccessToken() {
    try {
        const response = await axios.post('https://accounts.spotify.com/api/token', 
            `grant_type=refresh_token&refresh_token=${REFRESH_TOKEN}&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}`, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });
        currentAccessToken = response.data.access_token;
        console.log('✅ Токен обновлен:', new Date().toLocaleTimeString());
    } catch (error) {
        console.error('❌ Ошибка обновления:', error.response?.data || error.message);
    }
}

async function getCurrentTrack() {
    if (!currentAccessToken) {
        const success = await refreshAccessToken();
        if (!success) return '❌ Ошибка авторизации Spotify';
    }
    
    try {
        const response = await axios.get('https://api.spotify.com/v1/me/player/currently-playing', {
            headers: { 'Authorization': `Bearer ${currentAccessToken}` }
        });
        
        // Логируем статус для диагностики
        console.log('Spotify API статус:', response.status);
        
        if (response.status === 200 && response.data && response.data.item) {
            const artist = response.data.item.artists.map(a => a.name).join(', ');
            const track = response.data.item.name;
            return `🎵 ${track} — ${artist}`;
        } else if (response.status === 204) {
            return '⏸️ Spotify не играет (плеер закрыт или на паузе)';
        } else {
            return '❌ Неизвестный ответ от Spotify';
        }
    } catch (error) {
        // Подробное логирование ошибки
        console.error('Детали ошибки:', {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message
        });
        
        if (error.response?.status === 401) {
            await refreshAccessToken();
            return '🔄 Токен обновлен, попробуйте еще раз';
        }
        if (error.response?.status === 403) {
            return '🚫 Доступ запрещен. Проверьте разрешения в Spotify';
        }
        if (error.response?.status === 404) {
            return '❌ Не удалось найти активный плеер. Откройте Spotify на компьютере';
        }
        return `❌ Ошибка: ${error.response?.status || 'неизвестная'}`;
    }
}

app.get('/current-track', async (req, res) => {
    const trackInfo = await getCurrentTrack();
    res.set('Content-Type', 'text/plain; charset=utf-8');
    res.send(trackInfo);
});

app.get('/', (req, res) => {
    res.send('✅ Сервер работает! Используйте /current-track');
});

app.listen(PORT, async () => {
    console.log(`✅ Сервер запущен на порту ${PORT}`);
    await refreshAccessToken();
    setInterval(refreshAccessToken, 50 * 60 * 1000);
});
