import { fetchSitemapUrls, filterUrls } from './fetchSitemap.js';
import { parseMultipleSites } from './parser.js';

// Функция для парсинга сайта по карте сайта
const parseMultipleSitesFromSitemap = async (sitemapUrl, ws) => {
    try {
        // Шаг 1: Загружаем ссылки с карты сайта
        const urls = await fetchSitemapUrls(sitemapUrl);
        
        // Шаг 2: Фильтруем ссылки, исключая медиа и страницы товаров
        const filteredUrls = filterUrls(urls);
        
        // Шаг 3: Парсим страницы с фильтрованными URL
        if (filteredUrls.length === 0) {
            console.warn(`Нет подходящих ссылок в карте сайта: ${sitemapUrl}`);
            return [];
        }
        
        return await parseMultipleSites(filteredUrls, ws);
    } catch (error) {
        console.error('Ошибка при загрузке карты сайта:', error);
        // Возвращаем пустой массив, если не удалось загрузить sitemap
        return [];
    }
};

// Основная функция для обработки нескольких сайтов
export const parseSitesFromSitemap = async (sites, ws) => {
    try {
        const promises = sites.map(async (site) => {
            try {
                // Попробуем сначала загрузить ссылки из sitemap
                const sitemapUrl = `${site}/sitemap.xml`;
                let emails = await parseMultipleSitesFromSitemap(sitemapUrl, ws);
                
                // Если не удалось загрузить карту сайта или список URL пустой, парсим сайт как обычно
                if (emails.length === 0) {
                    console.log(`Карта сайта не найдена для ${site}, парсим сайт как обычно...`);
                    emails = await parseMultipleSites([site], ws); // Парсим как раньше
                }
                
                return { website: site, emails };
            } catch (error) {
                console.error(`Ошибка при парсинге сайта ${site}:`, error);
                return { website: site, emails: [] }; // Возвращаем пустой результат в случае ошибки
            }
        });

        // Выполняем все запросы параллельно
        const results = await Promise.all(promises);
        return results;
    } catch (error) {
        console.error('Ошибка при обработке сайтов:', error);
        return [];
    }
};
