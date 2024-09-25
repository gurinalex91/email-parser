import axios from 'axios';
import xml2js from 'xml2js';

// Функция для загрузки URL из sitemap с ограничением по глубине рекурсии
export const fetchSitemapUrls = async (sitemapUrl, depth = 0, maxDepth = 3) => {
    if (depth > maxDepth) {
        console.warn(`Достигнуто максимальное количество уровней рекурсии: ${maxDepth}`);
        return [];
    }

    try {
        const response = await axios.get(sitemapUrl);
        const sitemapXml = response.data;
        const parsedSitemap = await xml2js.parseStringPromise(sitemapXml);

        if (parsedSitemap.urlset && parsedSitemap.urlset.url) {
            // Если это обычная карта сайта с <url><loc>
            const urls = parsedSitemap.urlset.url.map(entry => entry.loc[0]);
            return urls;
        } else if (parsedSitemap.sitemapindex && parsedSitemap.sitemapindex.sitemap) {
            // Если это индекс карт сайта
            const sitemapUrls = parsedSitemap.sitemapindex.sitemap.map(entry => entry.loc[0]);
            let allUrls = [];

            // Для каждой карты сайта из индекса загружаем её и получаем страницы
            for (const sitemapUrl of sitemapUrls) {
                const urlsFromSitemap = await fetchSitemapUrls(sitemapUrl, depth + 1, maxDepth);  // Рекурсивный вызов с глубиной
                allUrls = allUrls.concat(urlsFromSitemap);
            }

            return allUrls;
        } else {
            console.error('Неподдерживаемая структура карты сайта.');
            return [];
        }
    } catch (error) {
        if (error.response) {
            console.error(`Ошибка при загрузке карты сайта: ${error.response.status} ${error.response.statusText}`);
        } else {
            console.error('Ошибка при загрузке карты сайта:', error.message);
        }
        return [];
    }
};

// Функция для фильтрации ненужных ссылок (медиа и товары)
export const filterUrls = (urls) => {
    const ignorePatterns = [
        /\/product\//, // Пример паттернов страниц товаров
        /\/item\//,
        /\.(webp|jpg|jpeg|png|gif|bmp|svg|ico|tiff|mp4|avi|mov|webm|ogg|pdf|docx|pptx|xlsx|zip|rar|tar\.gz)$/i // Исключаем медиа
    ];

    return urls.filter(url => !ignorePatterns.some(pattern => pattern.test(url)));
};
