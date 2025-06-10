/* eslint-disable jsx-a11y/anchor-is-valid */
import React from 'react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './home.css';

const fetchUrl = `http://localhost:${3001}`;

interface User {
  email: string;
  evalsCompleted: number;
  name: string;
  role: string;
}

const Home: React.FC = () => {
  const navigate = useNavigate();

  const [ user, setUser ] = useState<User | null>(null);
  const [ isLoading, setIsLoading ] = useState(true);
  const [ error, setError ] = useState<string | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`${fetchUrl}/me/`, {
          body: JSON.stringify({ returnData: true }),
          credentials: `include`,
          headers: { 'Content-Type': `application/json` },
          method: `POST`,
        });

        if (!response.ok) {
          await navigate(`/login`);
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const jsonData = await response.json();

        if (jsonData && jsonData.user) {
          setUser({
            email: jsonData.user.email,
            evalsCompleted: jsonData.user.evalsCompleted || 0,
            name: jsonData.user.name,
            role: jsonData.user.role,
          });
        } else {
          await navigate(`/login`);
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(`[Home useEffect] Session check failed:`, err);
        setError(`Failed to load user data. Please try again.`);
        await navigate(`/login`);
      } finally {
        setIsLoading(false);
      }
    };

    void checkSession();
  }, [ navigate ]);

  if (isLoading) {
    return <div className="home-container">
      <main className="main-content">
        <h1>Loading user data...</h1>
        <p>Please wait.</p>
      </main>
    </div>;
  }

  if (error) {
    return <div className="home-container">
      <main className="main-content">
        <h1>Error</h1>
        <p>{error}</p>
        <button onClick={() => navigate(`/login`)}>Go to Login</button>
      </main>
    </div>;
  }

  if (!user) {
    return <div className="home-container">
      <main className="main-content">
        <h1>User data not available.</h1>
        <p>Attempting to redirect...</p>
      </main>
    </div>;
  }

  return <div className="home-container">
    <main className="main-content">
      <h1>Welcome back, {user.name}!</h1>
      <p>Role: {user.role}</p>
      <p>Email: {user.email}</p>
      <section className="user-stats">
        <div className="stat">
          <h2>{user.evalsCompleted}</h2>
          <p>Evaluations Completed</p>
        </div>
      </section>
    </main>
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-left">
          <img src="/PR_LOGO.png" alt="Performance Review Logo" className="footer-logo" />
        </div>
        <div className="footer-center">
          <div className="footer-bottom">
            © 2025 Your Website. All rights reserved.
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  </div>;
};

export default Home;
