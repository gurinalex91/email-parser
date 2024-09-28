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
    const emails = new Set();
    const toVisit = new Set([site]);
    const visited = new Set();

    if (ws) {
        ws.send(JSON.stringify({ website: site, status: "В процессе", emails: [] }));
    }

    try {
        while (toVisit.size > 0) {
            const currentRequests = Array.from(toVisit).slice(0, MAX_CONCURRENT_REQUESTS);
            
            const promises = currentRequests.map(async (currentUrl) => {
                toVisit.delete(currentUrl);
                visited.add(currentUrl);

                try {
                    const response = await fetchWithTimeout(currentUrl);
                    const html = await response.text();
                    const extractedEmails = extractEmails(html);
                    extractedEmails.forEach(email => emails.add(email));

                    if (ws) {
                        ws.send(JSON.stringify({ website: site, status: "Обновление", emails: [...emails] }));
                    }

                    const links = extractKeyLinks(html, site);
                    links.forEach(link => {
                        if (!visited.has(link) && !toVisit.has(link)) {
                            toVisit.add(link);
                        }
                    });
                } catch (error) {
                    // Отправляем статус "Ошибка" в случае ошибки на определённой странице
                    if (ws) {
                        ws.send(JSON.stringify({ 
                            website: site, 
                            status: "Ошибка", 
                            message: `Ошибка при загрузке ${currentUrl}: ${error.message}`, 
                            emails: [...emails] 
                        }));
                    }
                    console.error(`Ошибка при загрузке ${currentUrl}: ${error.message}`);
                }
            });

            await Promise.allSettled(promises);
        }

        // Отправляем финальный статус "Готов"
        if (ws) {
            ws.send(JSON.stringify({ website: site, status: "Готов", emails: [...emails] }));
        }

    } catch (error) {
        // Отправляем общий статус "Ошибка", если не удаётся завершить парсинг сайта
        if (ws) {
            ws.send(JSON.stringify({ 
                website: site, 
                status: "Ошибка", 
                message: `Ошибка парсинга сайта ${site}: ${error.message}`, 
                emails: [...emails] 
            }));
        }
        console.error(`Ошибка парсинга сайта ${site}: ${error.message}`);
    }

    return Array.from(emails);
};

// Основная функция для параллельного парсинга нескольких сайтов
export const parseMultipleSites = async (sites, ws) => {
    console.log(`Начало парсинга для ${sites.length} сайтов`);

    const siteParsingPromises = sites.map(site => limit(() => parseSingleSite(site, ws)));
    const results = await Promise.allSettled(siteParsingPromises);

    console.log(`Парсинг завершен для всех сайтов`);

    return results.reduce((allEmails, result) => {
        if (result.status === 'fulfilled') {
            return allEmails.concat(result.value);
        } else {
            console.log(`Ошибка при парсинге одного из сайтов: ${result.reason}`);
        }
        return allEmails;
    }, []);
};
