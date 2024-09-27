import React from "react";
import "./ActionButtons.scss";

const ActionButtons = ({
    websites,
    ws,
    setLoading,
    loading, // проп для отслеживания состояния загрузки
}) => {
    const handleParse = () => {
        if (ws) {
            setLoading(true);
            const siteList = websites
                .split("\n")
                .filter((site) => site.trim() !== "");
            ws.send(JSON.stringify({ websites: siteList }));
        }
    };

    return (
        <div className="action-buttons">
            <button onClick={handleParse} disabled={loading}>
                {loading ? "Идёт парсинг..." : "Парсить"}
            </button>
        </div>
    );
};

export default ActionButtons;
