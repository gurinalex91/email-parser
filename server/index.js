import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import { startWebSocketServer } from './js/server.js';
import { parseSitesFromSitemap } from './js/parseMultipleSitesFromSitemap.js'; 


const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API-эндпоинт для парсинга сайтов
app.post('/parse', async (req, res) => {
    const { websites } = req.body;
    
    try {
        // Парсим сайты
        const results = await parseSitesFromSitemap(websites);
        
        // Возвращаем результаты
        res.json(results);
    } catch (error) {
        console.error('Ошибка при парсинге сайтов:', error);
        res.status(500).json({ message: 'Ошибка при парсинге сайтов', error });
    }
});

// Start the WebSocket server
startWebSocketServer();

// HTTP server
app.listen(PORT, () => {
    console.log(`HTTP сервер запущен на http://localhost:${PORT}`);
});
