// Functions for fetching with timeout
import fetch from 'node-fetch';

// Функция для обработки запросов с таймаутом
export const fetchWithTimeout = async (url, options = {}, timeout = 5000) => {
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