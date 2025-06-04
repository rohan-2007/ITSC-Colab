import React, { useEffect, useState } from 'react';
// import reactLogo from './assets/react.svg';
// import viteLogo from '/vite.svg';
import './App.css';

const App = () => {
  const [ _message, setMessage ] = useState(`Loading...`);

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

  return <div>
    <h1>Performance Review</h1>
    <button>Login</button>
    <button>Sign Up</button>
    <button>Supervisor Login</button>
    <button>Supervisor Sign Up</button>
  </div>;
};

export default App;

// import './App.css';
// const MainScreen = () =>
//   <div>
//     <h1>Performance Review</h1>
//     <button>Login</button>
//     <button>Sign Up</button>
//     <button>Supervisor Login</button>
//     <button>Supervisor Sign Up</button>
//   </div>;

// export default MainScreen;
