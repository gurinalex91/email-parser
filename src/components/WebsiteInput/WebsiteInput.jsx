import React from "react";
import "./WebsiteInput.scss";

const WebsiteInput = ({ websites, setWebsites }) => {
    return (
        <textarea
            value={websites}
            onChange={(e) => setWebsites(e.target.value)}
            placeholder="Введите сайты здесь, каждый с новой строки"
        />
    );
};

export default WebsiteInput;
