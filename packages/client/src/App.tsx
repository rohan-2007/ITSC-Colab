import React, { useEffect, useState } from 'react';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import './App.css';

const App = () => {
  const [ message, setMessage ] = useState(`Loading...`);

  const PORT = 3001;

  // Fake User Data
  const userData = {
    email: `efef@grgr.mgm`,
    name: `Kyle`,
    password: `1234`,
    role: `STUDENT`,
  };

  useEffect(() => {
    const fetchServerMessage = async () => {
      try {
        const response = await fetch(`http://localhost:${PORT}/signup/`, {
          body: JSON.stringify(userData),
          headers: {
            'Content-Type': `application/json`,
          },
          method: `POST`,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const textData = await response.text();
        // eslint-disable-next-line no-console
        console.log(`Successfully sent message`);
        setMessage(textData);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(`Failed to fetch server message:`, e);
        if (e instanceof Error) {
          setMessage(`Failed to load message from server.`);
        } else {
          setMessage(`Failed to load message due to an unknown error.`);
        }
      }
    };

    void fetchServerMessage();
  }, []);

  return <>
    <div>
      <a href="https://vite.dev" target="_blank" rel="noreferrer">
        <img src={viteLogo} className="logo" alt="Vite logo" />
      </a>
      <a href="https://react.dev" target="_blank" rel="noreferrer">
        <img src={reactLogo} className="logo react" alt="React logo" />
      </a>
    </div>
    <h1>UC Performance Review</h1>
    <div className="card">
      <p>
        {message}
      </p>
    </div>
  </>;
};

export default App;
