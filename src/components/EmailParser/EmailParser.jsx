import React, { useState, useEffect } from "react";
import Modal from "../modals/modal";
import EmailTable from "../EmailTable/EmailTable";
import WebsiteInput from "../WebsiteInput/WebsiteInput";
import ActionButtons from "../ActionButtons/ActionButtons";
import DomainExtractor from "../DomainExtractor/DomainExtractor"; // Импортируем новый компонент
import "./EmailParser.scss";

const EmailParser = () => {
    const [websites, setWebsites] = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [ws, setWs] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMessage, setModalMessage] = useState("");

    useEffect(() => {
        // Инициализация WebSocket при монтировании компонента
        const socket = new WebSocket("ws://localhost:5001");
        socket.onopen = () => {
            console.log("Соединение установлено");
            setWs(socket);
        };

        socket.onmessage = (event) => {
            const { message, email, website } = JSON.parse(event.data);

            if (email) {
                setResults((prevResults) => {
                    const updatedResults = [...prevResults];

                    // Добавляем новый результат в массив
                    updatedResults.push({
                        website: website,
                        emails: [email],
                    });

                    return updatedResults;
                });
            } else {
                setModalMessage(message);
                setModalOpen(true);
                setLoading(false);
            }
        };

        socket.onclose = () => {
            console.log("Соединение закрыто");
        };

        return () => {
            if (socket) {
                socket.close();
            }
        };
    }, []);

    const handleParse = () => {
        if (ws) {
            setLoading(true);
            const siteList = websites
                .split("\n")
                .filter((site) => site.trim() !== "");
            ws.send(JSON.stringify({ websites: siteList }));
        }
    };

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
            <ActionButtons handleParse={handleParse} loading={loading} />
            
            {/* Компонент для обработки и отображения доменов */}
            <DomainExtractor results={results} setResults={setResults} />

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
