// WebSocket server logic
import { WebSocketServer } from 'ws';
import { parseMultipleSites } from './parser.js';

export const startWebSocketServer = () => {
    const wss = new WebSocketServer({ port: 5001 });

    wss.on('connection', (ws) => {
        console.log('WebSocket клиент подключен');

        ws.on('message', async (message) => {
            const { websites } = JSON.parse(message);

            try {
                await parseMultipleSites(websites, ws);
                ws.send(JSON.stringify({ message: 'Парсинг завершен' }));
            } catch (error) {
                console.error('Ошибка при парсинге сайтов:', error);
                ws.send(JSON.stringify({ message: 'Произошла ошибка при парсинге сайтов' }));
            }
        });

        ws.on('close', () => {
            console.log('WebSocket клиент отключен');
        });
    });
};
