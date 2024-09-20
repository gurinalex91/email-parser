// Functions for parsing sites
import { extractEmails } from './emailExtractor.js';
import { extractLinks } from './linkExtractor.js';
import { fetchWithTimeout } from './fetchUtils.js';
import pLimit from 'p-limit';

// Функция для парсинга одного сайта
const MAX_CONCURRENT_REQUESTS = 20;
const limit = pLimit(MAX_CONCURRENT_REQUESTS);

// Функция для парсинга одного сайта
const parseSingleSite = async (site, maxDepth = 1, currentDepth = 0, ws) => {
    if (currentDepth > maxDepth) return [];

    const emails = new Set(); // Набор для уникальных email-адресов
    const toVisit = new Set([site]); // Набор для отслеживания ссылок, которые нужно посетить
    const visited = new Set(); // Набор для уже посещенных сайтов

    while (toVisit.size > 0) {
        // Берем не больше MAX_CONCURRENT_REQUESTS ссылок для обработки за один раз
        const currentRequests = Array.from(toVisit).slice(0, MAX_CONCURRENT_REQUESTS);
        const promises = currentRequests.map(async (currentUrl) => {
            toVisit.delete(currentUrl); // Убираем текущую ссылку из очереди посещения
            visited.add(currentUrl); // Добавляем текущую ссылку в посещенные

            try {
                const response = await fetchWithTimeout(currentUrl); // Делаем запрос к URL с таймаутом
                const html = await response.text(); // Получаем HTML содержимое страницы

                // Извлекаем email-адреса из mailto и текста
                const newEmails = extractEmails(html); // Используем объединенную функцию

                // Добавляем email-адреса в набор
                newEmails.forEach(email => emails.add(email));

                // Отправляем новые email через WebSocket, если ws определён
                if (ws) {
                    newEmails.forEach(email => {
                        ws.send(JSON.stringify({ website: site, email }));
                    });
                }

                // Извлечение ссылок для последующего парсинга
                if (currentDepth < maxDepth) {
                    const links = extractLinks(html, site); // Извлекаем все ссылки на другие страницы сайта
                    links.forEach(link => {
                        // Добавляем ссылки, если они не были посещены и не находятся в очереди на посещение
                        if (!visited.has(link) && !toVisit.has(link)) {
                            toVisit.add(link);
                        }
                    });
                }
            } catch (error) {
                console.error(`Ошибка при загрузке ${currentUrl}:`, error.message);
            }
        });

        // Ждем завершения всех запросов в текущей итерации
        await Promise.allSettled(promises);
    }

    // Возвращаем уникальные email-адреса
    return Array.from(emails);
};

// Основная функция для параллельного парсинга нескольких сайтов
export const parseMultipleSites = async (sites, ws) => {
    const siteParsingPromises = sites.map(site => limit(() => parseSingleSite(site, 1, 0, ws)));
    const results = await Promise.allSettled(siteParsingPromises);

    return results.reduce((allEmails, result) => {
        if (result.status === 'fulfilled') {
            return allEmails.concat(result.value);
        }
        return allEmails;
    }, []);
};