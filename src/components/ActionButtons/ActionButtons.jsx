import React from "react";
import "./ActionButtons.scss";

const ActionButtons = ({ handleParse, loading }) => {
    return (
        <div className="action-btns">
            <button onClick={handleParse} disabled={loading}>
                {loading ? "Идёт парсинг..." : "Парсить"}
            </button>
        </div>
    );
};

export default ActionButtons;
