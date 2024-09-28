import React from "react";
import "./EmailTable.scss";

const EmailTable = ({ results }) => {
    return (
        <table className="table">
            <thead>
                <tr>
                    <th>Website</th>
                    <th>Emails</th>
                    <th>Статус</th>
                </tr>
            </thead>
            <tbody>
                {results.map((result, index) => (
                    <tr key={index}>
                        {/* Используем website как уникальный ключ */}
                        <td>
                            <a
                                href={`https://${result.website}`}
                                target="_blank"
                                rel="noopener noreferrer">
                                {result.website}
                            </a>
                        </td>
                        <td>
                            {result.emails.length > 0
                                ? result.emails.join(", ")
                                : "Нет email"}
                        </td>
                        {/* Обработка пустого списка */}
                        <td>{result.status || "Неизвестный статус"}</td>
                        {/* Обработка отсутствующего статуса */}
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

export default EmailTable;
