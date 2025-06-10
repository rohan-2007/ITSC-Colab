// We can get rid of the links at the footer but if u find a use, then use it
import React from 'react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import fetchUrl from '../testingUrl';
import './home.css';

interface User {
  email: string;
  evalsCompleted: number;
  name: string;
  role: string;
}

const Home: React.FC = () => {
  const navigate = useNavigate();

  const [ user ] = useState<User>({
    email: `Loading...`,
    evalsCompleted: 0,
    name: `Loading...`,
    role: `Loading...`,
  });

  useEffect(() => {
    const checkSession = async () => {
      try {
        // eslint-disable-next-line no-console
        console.log(`Checking session...`);
        console.log(`fetchUrl: ${fetchUrl}`);
        const response = await fetch(`${fetchUrl}/me/`, {
          body: JSON.stringify({ requestData: true }),
          credentials: `include`,
          headers: { 'Content-Type': `application/json` },
          method: `POST`,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const jsonData = await response.json();

        if (jsonData.sessionActive) {
          user.email = jsonData.user.email;
          user.name = jsonData.user.name;
          user.role = jsonData.user.role;
          // eslint-disable-next-line no-console
          console.log(`User data fetched successfully:`, jsonData.user);
        } else {
          await navigate(`/login`);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(`Session check failed:`, error);
      }
    };

    void checkSession();
  }, [ navigate, user ]);

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
    {/* <footer className="footer">
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
    </footer> */}
  </div>;
};
export default Home;
