// Functions for extracting links
import * as cheerio from 'cheerio';
import { URL } from 'url';

// Функция для извлечения ссылок и перехода по ним
export const extractLinks = (html, baseUrl) => {
    const $ = cheerio.load(html);
    const links = new Set();
    const baseDomain = new URL(baseUrl).hostname;
    const ignoreExtensions = /\.(webp|jpg|jpeg|png|gif|bmp|svg|ico|tiff|mp4|avi|mov|webm|ogg|pdf|docx|pptx|xlsx|zip|rar|tar\.gz)$/i;

    $('a').each((i, link) => {
        const href = $(link).attr('href');
        if (href) {
            try {
                // Игнорируем якорные ссылки
                if (href.startsWith('#')) {
                    return;
                }
                
                const fullUrl = new URL(href, baseUrl).href;
                const linkDomain = new URL(fullUrl).hostname;
                
                // Проверяем домен и исключаем ссылки на файлы с запрещёнными расширениями
                if (linkDomain === baseDomain && !ignoreExtensions.test(fullUrl)) {
                    links.add(fullUrl);  // Добавляем только если это не якорная ссылка и не файл с запрещённым расширением
                }
            } catch (error) {
                console.error(`Ошибка при обработке ссылки: ${href}`, error);
            }
        }
    });

    return Array.from(links);
};