// Functions for extracting emails
import * as cheerio from 'cheerio';

// Функция для Извлечения Текста без Медиа
const extractTextContent = (html) => {
    const $ = cheerio.load(html);
    // Удалите медиа элементы
    $('img, video, audio, iframe, object, embed').remove();
    const textContent = $.text();
    return textContent;
};

// Функция для проверки на наличие изображений в email
const isValidEmail = (email) => {
    const invalidEmailPattern = /@.*\.(jpg|jpeg|png|gif|bmp|svg|ico|tiff|webp|pdf|docx|pptx|xlsx|zip|rar)$/i;
    return !invalidEmailPattern.test(email);
};

// Функция для извлечения email-адресов из ссылок mailto:
const extractEmailsFromMailto = (html) => {
    const $ = cheerio.load(html);
    const emails = [];

    // Поиск всех ссылок с href="mailto:"
    $('a[href^="mailto:"]').each((_, element) => {
        const email = $(element).attr('href').replace('mailto:', '').split('?')[0]; // игнорируем query-параметры
        if (email && isValidEmail(email)) {
            emails.push(email.trim());
        }
    });

    return emails;
};

// Функция для Извлечения Email из Текста
const extractEmailsFromText = (text) => {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

    // Находим все email-адреса
    const emails = text.match(emailRegex) || [];

    // Фильтруем адреса, исключая некорректные конструкции и нежелательные URL
    return emails.filter(email => {
        return isValidEmail(email) && // Используем проверку на валидность email
               /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email) && 
               !/^(https?:\/\/|www\.|@)/.test(email); // Исключаем URL и адреса с @ в начале
    });
};

// Главная функция для извлечения email-адресов (с приоритетом на mailto)
export const extractEmails = (html) => {
    // Извлечение email-адресов из mailto:
    const mailtoEmails = extractEmailsFromMailto(html);

    // Извлечение текста страницы без медиа элементов
    const textContent = extractTextContent(html);

    // Извлечение email-адресов из текста
    const textEmails = extractEmailsFromText(textContent);

    // Объединяем результаты и удаляем дубликаты
    const allEmails = [...new Set([...mailtoEmails, ...textEmails])];

    return allEmails;
};
