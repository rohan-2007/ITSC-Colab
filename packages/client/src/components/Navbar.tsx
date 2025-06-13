/* eslint-disable jsx-a11y/alt-text */
// src/components/Navbar.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';
import logo from '../assets/ITSC_LOGO.png';

const Navbar: React.FC = () => {
  const [ isSupervisor, setIsSupervisor ] = React.useState<boolean>(false);

  React.useEffect(() => {
    const fetchRole = async () => {
      try {
        const response = await fetch(`http://localhost:3001/me/`, {
          body: JSON.stringify({ returnData: true }),
          credentials: `include`,
          headers: { 'Content-Type': `application/json` },
          method: `POST`,
        });
        if (!response.ok) {
          throw new Error(`Session not found. Please log in.`);
        }
        const data = await response.json();
        if (data) {
          setIsSupervisor(data.user.role === `SUPERVISOR`);
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(`Failed to fetch user data: ${err instanceof Error ? err.message : String(err)}`);
      }
    };
    void fetchRole();
  }, []);

  return <header className="navbar">
    <img src={logo} className="navbar-logo" />
    <nav className="nav-links">
      <Link to="/">Home</Link>
      <Link to="/evaluations">Evaluations</Link>
      <Link to="/profile">Profile</Link>
      {isSupervisor && <Link to="/supervisor">Supervisor</Link>}
      <Link to="/contact">Contact</Link>
    </nav>
    <button
      className="logout-btn"
      onClick={async () => {
        await fetch(`http://localhost:3001/logout/`, {
          credentials: `include`,
          method: `POST`,
        });
        window.location.reload();
      }}
    >Log Out</button>
  </header>;
};
export default Navbar;
