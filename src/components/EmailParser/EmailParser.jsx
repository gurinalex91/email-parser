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

    const handleWebSocketMessage = useCallback((data) => {
        if (data.email) {
            setResults((prevResults) => {
                const siteIndex = prevResults.findIndex(
                    (result) => result.website === data.website
                );
                if (siteIndex !== -1) {
                    const site = { ...prevResults[siteIndex] };
                    if (!site.emails.includes(data.email)) {
                        site.emails.push(data.email);
                    }
                    return [
                        ...prevResults.slice(0, siteIndex),
                        site,
                        ...prevResults.slice(siteIndex + 1),
                    ];
                }
                return [
                    ...prevResults,
                    { website: data.website, emails: [data.email] },
                ];
            });
        } else {
            setModalMessage(data.message);
            setModalOpen(true);
            setLoading(false);
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

    const handleClear = () => {
        setWebsites("");
        setResults([]);
        setLoading(false);
        setModalOpen(false);
    };

    return (
        <div className="App">
            <h1>Email Parser</h1>
            <div className="content">
                <p>Welcome to the email parser.</p>
            </div>
            <div className="clear-btn">
                <button onClick={handleClear}>Очистить</button>
            </div>
            <WebsiteInput websites={websites} setWebsites={setWebsites} />
            <ActionButtons
                websites={websites}
                ws={ws}
                setLoading={setLoading}
                loading={loading}
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
