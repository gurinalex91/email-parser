import React, { useState, useEffect, useCallback } from "react";
import Modal from "../modals/modal";
import EmailTable from "../EmailTable/EmailTable";
import WebsiteInput from "../WebsiteInput/WebsiteInput";
import ActionButtons from "../ActionButtons/ActionButtons";
import "./EmailParser.scss";

const EmailParser = () => {
    const [websites, setWebsites] = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [ws, setWs] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMessage, setModalMessage] = useState("");
    const [completedSites, setCompletedSites] = useState(0); // Количество завершённых сайтов

    const handleWebSocketMessage = useCallback((data) => {
        console.log("WebSocket message received:", data); // Логируем полученные данные

        if (data.status && data.status === "Ошибка") {
            // Если статус "Ошибка", сохраняем сообщение об ошибке в результатах
            setResults((prevResults) => {
                const siteIndex = prevResults.findIndex(
                    (result) => result.website === data.website
                );

                if (siteIndex !== -1) {
                    const site = { ...prevResults[siteIndex] };
                    site.status = `Ошибка: ${
                        data.message || "Неизвестная ошибка"
                    }`; // Устанавливаем сообщение об ошибке

                    return [
                        ...prevResults.slice(0, siteIndex),
                        site,
                        ...prevResults.slice(siteIndex + 1),
                    ];
                }

                return [
                    ...prevResults,
                    {
                        website: data.website,
                        emails: data.emails || [],
                        status: `Ошибка: ${
                            data.message || "Неизвестная ошибка"
                        }`,
                    },
                ];
            });
        } else if (data.status && data.status !== "Готов") {
            // Если статус "в процессе" или "Обновление", обновляем данные сайта
            setResults((prevResults) => {
                const siteIndex = prevResults.findIndex(
                    (result) => result.website === data.website
                );

                if (siteIndex !== -1) {
                    const site = { ...prevResults[siteIndex] };
                    site.status = data.status;

                    // Если есть новые email, добавляем их
                    if (data.emails) {
                        const uniqueEmails = Array.from(
                            new Set([...site.emails, ...data.emails])
                        );
                        site.emails = uniqueEmails;
                    }

                    return [
                        ...prevResults.slice(0, siteIndex),
                        site,
                        ...prevResults.slice(siteIndex + 1),
                    ];
                }

                return [
                    ...prevResults,
                    {
                        website: data.website,
                        emails: data.emails || [],
                        status: data.status,
                    },
                ];
            });
        } else if (data.status === "Готов") {
            // Когда парсинг одного сайта завершён, обновляем статус на "Готов" и увеличиваем счётчик завершённых сайтов
            setResults((prevResults) => {
                const siteIndex = prevResults.findIndex(
                    (result) => result.website === data.website
                );

                if (siteIndex !== -1) {
                    const site = { ...prevResults[siteIndex] };
                    site.status = "Готов"; // Устанавливаем финальный статус

                    return [
                        ...prevResults.slice(0, siteIndex),
                        site,
                        ...prevResults.slice(siteIndex + 1),
                    ];
                }

                return prevResults;
            });
            setCompletedSites((prevCompletedSites) => prevCompletedSites + 1);
        }
    }, []);

    useEffect(() => {
        const socket = new WebSocket("ws://localhost:5001");
        socket.onopen = () => {
            console.log("Соединение установлено");
            setWs(socket);
        };
        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            handleWebSocketMessage(data);
        };
        socket.onclose = () => {
            console.log("Соединение закрыто");
        };
        return () => {
            socket.close();
        };
    }, [handleWebSocketMessage]);

    // Проверяем завершение парсинга всех сайтов
    useEffect(() => {
        if (completedSites > 0 && completedSites === results.length) {
            // Если все сайты завершены, показываем модалку
            setModalMessage("Парсинг завершён");
            setModalOpen(true);
            setLoading(false);
        }
    }, [completedSites, results.length]);

    const handleClear = () => {
        setWebsites("");
        setResults([]);
        setLoading(false);
        setModalOpen(false);
        setCompletedSites(0); // Сбрасываем количество завершённых сайтов
    };

    return (
        <div className="container">
            <h1 className="title">Email Parser</h1>
            <div className="content">
                <p className="text">Welcome to the email parser.</p>
            </div>

            <WebsiteInput websites={websites} setWebsites={setWebsites} />
            <ActionButtons
                websites={websites}
                ws={ws}
                setLoading={setLoading}
                loading={loading}
                handleClear={handleClear}
            />
            <EmailTable results={results} />
            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                message={modalMessage}
            />
        </div>
    );
};

export default EmailParser;
