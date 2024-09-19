import express from 'express';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import cors from 'cors';
import pLimit from 'p-limit';
import { URL } from 'url';
import { WebSocketServer } from 'ws';

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const wss = new WebSocketServer({ port: 5001 }); // WebSocket сервер на порту 5001

// Функция для Извлечения Текста без Медиа
const extractTextContent = (html) => {
    const $ = cheerio.load(html);
    // Удалите медиа элементы
    $('img, video, audio, iframe, object, embed').remove();
    const textContent = $.text();
    return textContent;
};


// Функция для Извлечения Email из Текста
const extractEmailsFromText = (text) => {
    const emailRegex = /[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+/g;
    return text.match(emailRegex) || [];
};

// Функция для извлечения ссылок и перехода по ним
const extractLinks = (html, baseUrl) => {
    const $ = cheerio.load(html);
    const links = new Set();
    const baseDomain = new URL(baseUrl).hostname;

    $('a').each((i, link) => {
        const href = $(link).attr('href');
        if (href) {
            try {
                const fullUrl = new URL(href, baseUrl).href;
                const linkDomain = new URL(fullUrl).hostname;
                if (linkDomain === baseDomain) {
                    links.add(fullUrl);
                }
            } catch (error) {
                console.error(`Ошибка при обработке ссылки: ${href}`, error);
            }
        }
    });

    return Array.from(links);
};

// Функция для обработки запросов с таймаутом
const fetchWithTimeout = async (url, options = {}, timeout = 5000) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(timer);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response;
    } catch (error) {
        clearTimeout(timer);
        console.error(`Ошибка при загрузке ${url}:`, error.message);
        throw error;
    }
};

// Функция для парсинга одного сайта
const MAX_CONCURRENT_REQUESTS = 20;
const limit = pLimit(MAX_CONCURRENT_REQUESTS);

const parseSingleSite = async (site, maxDepth = 1, currentDepth = 0, ws) => {
    if (currentDepth > maxDepth) return [];

    const emails = new Set();
    const toVisit = new Set([site]);
    const visited = new Set();

    while (toVisit.size > 0) {
        const currentRequests = Array.from(toVisit).slice(0, MAX_CONCURRENT_REQUESTS);
        const promises = currentRequests.map(async (currentUrl) => {
            toVisit.delete(currentUrl);
            visited.add(currentUrl);

            try {
                const response = await fetchWithTimeout(currentUrl);
                const html = await response.text();
                const textContent = extractTextContent(html);
                const newEmails = extractEmailsFromText(textContent);
                newEmails.forEach(email => emails.add(email));

                if (ws) {
                    newEmails.forEach(email => {
                        ws.send(JSON.stringify({ website: site, email }));
                    });
                }

                if (currentDepth < maxDepth) {
                    const links = extractLinks(html, site);
                    links.forEach(link => {
                        if (!visited.has(link) && !toVisit.has(link)) {
                            toVisit.add(link);
                        }
                    });
                }
            } catch (error) {
                console.error(`Ошибка при загрузке ${currentUrl}:`, error.message);
            }
        });

        await Promise.allSettled(promises);
    }

    return Array.from(emails);
};

// Основная функция для параллельного парсинга нескольких сайтов
const parseMultipleSites = async (sites, ws) => {
    const siteParsingPromises = sites.map(site => limit(() => parseSingleSite(site, 3, 0, ws)));
    const results = await Promise.allSettled(siteParsingPromises);

    return results.reduce((allEmails, result) => {
        if (result.status === 'fulfilled') {
            return allEmails.concat(result.value);
        }
        return allEmails;
    }, []);
};

// WebSocket обработчик
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

// HTTP сервер
app.listen(PORT, () => {
    console.log(`HTTP сервер запущен на http://localhost:${PORT}`);
});
