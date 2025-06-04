import React, { useState } from 'react';
import './App.css';

const App = () => {
  const [ message, setMessage ] = useState(``);
  const [ isLoading, setIsLoading ] = useState(false);

  const PORT = 3001;

  // Dummy User Info
  const userData = {
    email: `efef@grgr.mgm`,
    name: `Kyle`,
    password: `1234`,
    role: `STUDENT`,
  };

  const handleSignUp = async () => {
    setIsLoading(true);
    setMessage(`Sending signup request...`);

    try {
      const response = await fetch(`http://localhost:${PORT}/signup/`, {
        body: JSON.stringify(userData),
        headers: { 'Content-Type': `application/json` },
        method: `POST`,

      });

      const responseText = await response.text();

      if (!response.ok) {
        throw new Error(responseText || `Signup failed`);
      }

      setMessage(`✅ Signup success: ${responseText}`);
    } catch (error) {
      if (error instanceof Error) {
        setMessage(`❌ Signup error: ${error.message}`);
      } else {
        setMessage(`❌ An unknown error occurred.`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return <div>
    <h1>Performance Review</h1>
    <button onClick={handleSignUp} disabled={isLoading}>
      {isLoading ? `Signing up...` : `Sign Up`}
    </button>
    <div style={{ color: `gray`, marginTop: `1rem` }}>{message}</div>
  </div>;
};

export default App;
