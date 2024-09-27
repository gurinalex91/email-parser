// Функция для извлечения ссылок с фильтрацией по ключевым страницам
import * as cheerio from 'cheerio';
import { URL } from 'url';

export const extractKeyLinks = (html, baseUrl) => {
    const $ = cheerio.load(html);
    const links = new Set();
    const baseDomain = new URL(baseUrl).hostname;

    // Ключевые слова для фильтрации URL
    const keyWords = [
        'contact', 'kontakt', 'contacts', 'support',
        'help', 'customer-service', 'inquiry', 'feedback',
        'get-in-touch', 'reach-us', 'about', 'home', 'impressum', 'kontakty'
    ].map(word => word.toLowerCase());

    $('a').each((i, link) => {
        const href = $(link).attr('href');
        if (href && !href.startsWith('#')) { // Игнорируем якорные ссылки
            try {
                const fullUrl = new URL(href, baseUrl).href;
                const linkDomain = new URL(fullUrl).hostname;

                // Проверяем домен и наличие ключевых слов в URL
                if (linkDomain === baseDomain) {
                    const lowerCaseUrl = fullUrl.toLowerCase();
                    if (keyWords.some(word => lowerCaseUrl.includes(word))) {
                        links.add(fullUrl); // Добавляем только релевантные ссылки
                    }
                }
            } catch (error) {
                console.error(`Ошибка при обработке ссылки: ${href}`, error);
            }
        }
    });

    return Array.from(links);
};
