import React from "react";
import "./ActionButtons.scss";

const ActionButtons = ({
    websites,
    ws,
    setLoading,
    loading, // проп для отслеживания состояния загрузки
    handleClear,
    startParsing,
}) => {
    // Обработка кнопки "Парсить"
    const handleParse = () => {
        if (ws) {
            setLoading(true);
            const siteList = websites
                .split("\n")
                .filter((site) => site.trim() !== "");

            // Отправляем сайты через WebSocket
            ws.send(JSON.stringify({ websites: siteList }));

            // Запуск парсинга через Supabase
            startParsing(siteList)
                .then(() => {
                    console.log("Сайты добавлены в базу данных");
                })
                .catch((error) => {
                    console.error(
                        "Ошибка при добавлении в базу данных:",
                        error
                    );
                });
        }
    };

    return (
        <div className="action-buttons">
            <button onClick={handleParse} disabled={loading}>
                {loading ? "Идёт парсинг..." : "Парсить"}
            </button>
            <button onClick={handleClear}>Очистить</button>
        </div>
    );
};

export default ActionButtons;
