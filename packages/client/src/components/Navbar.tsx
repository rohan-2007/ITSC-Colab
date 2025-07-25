import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';
import logo from '../assets/ITSC_LOGO.png';

const Navbar: React.FC = () => {
  const navigate = useNavigate();

  return <header className="navbar">
    <img src={logo} className="navbar-logo" alt="ITSC Logo" />
    <nav className="nav-links">
      <Link to="/">Home</Link>
      <Link to="/evaluations">Evaluations</Link>
      <Link to="/profile">Profile</Link>
      {(localStorage.getItem(`userMeta`) &&
        JSON.parse(localStorage.getItem(`userMeta`) as string).role === `SUPERVISOR`) &&
          <>
            <Link to="/supervisor">Supervisor</Link>
            <Link to="/change_rubric">Edit Rubric</Link>
          </>}
      <Link to="/contact">Contact</Link>
    </nav>
    <button
      className="logout-btn"
      onClick={async () => {
        await fetch(`http://localhost:3001/logout/`, {
          credentials: `include`,
          method: `POST`,
        });
        await navigate(`/`);
        window.location.reload();
      }}
    >Log Out</button>
  </header>;
};
export default Navbar;
