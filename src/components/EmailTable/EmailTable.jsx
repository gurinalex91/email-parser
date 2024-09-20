import React from "react";
import "./EmailTable.scss";

const EmailTable = ({ results }) => {
    return (
        <table border="1" style={{ marginTop: "20px" }}>
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
                        <td>
                            <a
                                href={`https://${result.website}`}
                                target="blank"
                                rel="noopener noreferrer"
                            >
                                {result.website}
                            </a>
                        </td>
                        <td>{result.emails.join(", ")}</td>
                        <td>{result.status}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

export default EmailTable;
