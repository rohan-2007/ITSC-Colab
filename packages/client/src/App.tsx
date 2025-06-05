import React, { useState } from 'react';
import './App.css';
import SignUp from './SignUp';

const App: React.FC = () => {
  const [ message, setMessage ] = useState(``);
  const [ isLoading, setIsLoading ] = useState(false);
  const [ isOpen, setIsOpen ] = useState(false);

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

  const userData2 = {
    email: `efef@grgr.mgm`,
    password: `1234`,
  };

  const handleLogin = async () => {
    setIsLoading(true);
    setMessage(`Sending login request...`);

    try {
      const response = await fetch(`http://localhost:${PORT}/login/`, {
        body: JSON.stringify(userData2),
        headers: { 'Content-Type': `application/json` },
        method: `POST`,
      });

      const responseText = await response.text();

      if (!response.ok) {
        throw new Error(responseText || `Login failed`);
      }

      setMessage(`Login success: ${responseText}`);
    } catch (error) {
      if (error instanceof Error) {
        setMessage(`Login error: ${error.message}`);
      } else {
        setMessage(`An unknown error occurred.`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const togglePopup = () => {
    setIsOpen(!isOpen);
  };

  return <div className="centered-page">
    <h1>UC Performance Review</h1>
    <div className="button-group">
      <button onClick={togglePopup} disabled={isLoading}>
        {isLoading ? `Signing up...` : `Sign Up`}
      </button>
      <button onClick={handleLogin} disabled={isLoading}>
        {isLoading ? `Logging in...` : `Login`}
      </button>
      {isOpen && (
        <div>
          <SignUp onSuccess={togglePopup} />
          <button onClick={togglePopup}>Close</button>
        </div>
      )}
    </div>
    <div style={{ color: `gray`, marginTop: `1rem` }}>{message}</div>
  </div>;
};

export default App;
