import React, { useState, useEffect } from "react";
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

    useEffect(() => {
        const socket = new WebSocket("ws://localhost:5001");
        setWs(socket);

        socket.onmessage = (event) => {
            const { message } = JSON.parse(event.data);
            setModalMessage(message);
            setModalOpen(true);
            setLoading(false);
        };

        return () => {
            if (socket) {
                socket.close();
            }
        };
    }, []);

    useEffect(() => {
        if (ws) {
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.email) {
                    setResults((prevResults) => {
                        const updatedResults = [...prevResults];
                        const siteIndex = updatedResults.findIndex(
                            (result) => result.website === data.website
                        );

                        if (siteIndex !== -1) {
                            const site = updatedResults[siteIndex];
                            if (!site.emails.includes(data.email)) {
                                site.emails.push(data.email);
                                updatedResults[siteIndex] = site;
                            }
                        } else {
                            updatedResults.push({
                                website: data.website,
                                emails: [data.email],
                            });
                        }

                        return updatedResults;
                    });
                } else {
                    console.log(data.message);
                    setModalMessage(data.message);
                    setModalOpen(true);
                    setLoading(false);
                }
            };
        }
    }, [ws]);

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
                <p>Welcome to the huyeviy email parser.</p>
            </div>
            <div className="clear-btn">
                <button onClick={handleClear}>Очистить</button>
            </div>
            <WebsiteInput websites={websites} setWebsites={setWebsites} />
            <ActionButtons
                handleParse={handleParse}
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
