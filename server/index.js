import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import { startWebSocketServer } from './js/server.js';

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Start the WebSocket server
startWebSocketServer();

// HTTP server
app.listen(PORT, () => {
    console.log(`HTTP сервер запущен на http://localhost:${PORT}`);
});
