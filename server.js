const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Переменная для хранения текущего трека
let currentTrack = "⏸️ Spotify не играет";

app.use(express.json()); // Чтобы читать JSON из POST запросов

// Эндпоинт для обновления трека (твой компьютер будет стучаться сюда)
app.post('/update-track', (req, res) => {
    const { track } = req.body;
    if (track) {
        currentTrack = track;
        console.log('🎵 Трек обновлён:', track);
        res.json({ status: 'ok' });
    } else {
        res.json({ status: 'error', message: 'no track' });
    }
});

// Эндпоинт для Nightbot
app.get('/current-track', (req, res) => {
    res.set('Content-Type', 'text/plain; charset=utf-8');
    res.send(currentTrack);
});

// Простой тест
app.get('/', (req, res) => {
    res.send('✅ Сервер работает');
});

app.listen(PORT, () => {
    console.log(`✅ Сервер запущен на порту ${PORT}`);
});
