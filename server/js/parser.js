// Functions for parsing sites
import { extractEmails } from './emailExtractor.js';
import { extractKeyLinks } from './linkExtractor.js';
import { fetchWithTimeout } from './fetchUtils.js';
import pLimit from 'p-limit';

// Максимальное количество параллельных запросов
const MAX_CONCURRENT_REQUESTS = 20;
const limit = pLimit(MAX_CONCURRENT_REQUESTS);

// Функция для парсинга одного сайта
const parseSingleSite = async (site, ws) => {
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

                // Извлекаем email-адреса и добавляем их в набор
                extractEmails(html).forEach(email => emails.add(email));

                // Отправляем новые email через WebSocket, если ws определён
                if (ws) {
                    emails.forEach(email => ws.send(JSON.stringify({ website: site, email })));
                }

                // Извлечение ключевых ссылок для последующего парсинга
                const links = extractKeyLinks(html, site); // Извлекаем ключевые ссылки
                links.forEach(link => {
                    // Добавляем ссылки, если они не были посещены и не находятся в очереди на посещение
                    if (!visited.has(link) && !toVisit.has(link)) {
                        toVisit.add(link);
                    }
                });
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
    const siteParsingPromises = sites.map(site => limit(() => parseSingleSite(site, ws)));
    const results = await Promise.allSettled(siteParsingPromises);

    return results.reduce((allEmails, result) => {
        if (result.status === 'fulfilled') {
            return allEmails.concat(result.value);
        }
        return allEmails;
    }, []);
};
