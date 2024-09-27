import { useEffect } from "react";

// Функция для извлечения домена из URL
const extractDomain = (url) => {
    // Добавляем протокол, если он отсутствует
    if (!/^https?:\/\//i.test(url)) {
        url = `http://${url}`;
    }
    
    try {
        const { hostname } = new URL(url);
        return hostname;
    } catch (error) {
        console.error(`Ошибка извлечения домена из URL: ${url}`, error);
        return url; // Если не удалось извлечь домен, вернем оригинальный URL
    }
};

// Компонент для извлечения домена и отображения результата
const DomainExtractor = ({ results, setResults }) => {
    useEffect(() => {
        // Обрабатываем результаты только если они изменились
        const processedResults = results.map((result) => ({
            website: extractDomain(result.website),
            emails: result.emails,
        }));

        // Убираем дубликаты сайтов
        const uniqueResults = processedResults.reduce((acc, current) => {
            const siteIndex = acc.findIndex((r) => r.website === current.website);
            if (siteIndex !== -1) {
                // Объединение email без дубликатов
                acc[siteIndex].emails = [...new Set([...acc[siteIndex].emails, ...current.emails])];
            } else {
                acc.push(current);
            }
            return acc;
        }, []);

        // Проверяем, отличаются ли обработанные результаты от текущих
        const resultsChanged = JSON.stringify(uniqueResults) !== JSON.stringify(results);

        if (resultsChanged) {
            // Обновляем результаты только если есть изменения
            setResults(uniqueResults);
        }
    }, [results, setResults]); // Добавляем зависимость на `results` и `setResults`

    return null; // Этот компонент не рендерит ничего, он только обрабатывает данные
};

export default DomainExtractor;
