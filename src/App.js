import React, { useState, useEffect } from 'react';
import './App.scss';
import Modal from './modals/modal';

function EmailParser() {
  const [websites, setWebsites] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [ws, setWs] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  useEffect(() => {
    // Создание соединения WebSocket
    const socket = new WebSocket('ws://localhost:5001');
    setWs(socket);

    socket.onmessage = (event) => {
      const { message } = JSON.parse(event.data);
      setModalMessage(message);
      setModalOpen(true);
      setLoading(false);
    };

    // Очистка соединения при размонтировании компонента
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
          setResults(prevResults => {
            const updatedResults = [...prevResults];
            const siteIndex = updatedResults.findIndex(result => result.website === data.website);

            if (siteIndex !== -1) {
              const site = updatedResults[siteIndex];
              if (!site.emails.includes(data.email)) {
                site.emails.push(data.email);
                updatedResults[siteIndex] = site;
              }
            } else {
              updatedResults.push({ website: data.website, emails: [data.email] });
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
      const siteList = websites.split('\n').filter(site => site.trim() !== '');
      ws.send(JSON.stringify({ websites: siteList }));
    }
  };

  const handleClear = () => {
    setWebsites('');
    setResults([]);
    setLoading(false);
    setModalOpen(false);
  };

  return (
    <div className="App">
      <div>
        <h1>Email Parser</h1>
        <div className="content">
          <p>Welcome to the huyeviy email parser.</p>
        </div>
      </div>
      <div className="clear-btn">
        <button onClick={handleClear}>
          Очистить
        </button>
      </div>
      <textarea
        value={websites}
        onChange={(e) => setWebsites(e.target.value)}
        placeholder="Введите сайты здесь, каждый с новой строки"
      />
      <br />
      <button onClick={handleParse} disabled={loading}>
        {loading ? 'Идёт парсинг...' : 'Парсить'}
      </button>

      <table border="1" style={{ marginTop: '20px' }}>
        <thead>
          <tr>
            <th>Website</th>
            <th>Emails</th>
          </tr>
        </thead>
        <tbody>
          {results.map((result, index) => (
            <tr key={index}>
              <td><a href={result.website} target='blank'>{result.website}</a></td>
              <td>{result.emails.join(', ')}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} message={modalMessage} />
    </div>
  );
}

export default EmailParser;
