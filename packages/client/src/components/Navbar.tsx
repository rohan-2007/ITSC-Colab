// src/components/Navbar.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';
import logo from '../assets/UC_PERFORMANCE_REVIEW_LOGO.png';

const Navbar: React.FC = () => {
  return (
    <header className="navbar">
      <img src={logo} className='navbar-logo'/>
      <nav className="nav-links">
        <Link to="/">Home</Link>
        <Link to="/about">About</Link>
        <Link to="/contact">Contact</Link>
        <Link to="/login">Login</Link>
        <Link to="/evaluations">Evaluations</Link>
      </nav>
      <div></div>
    </header>
  );
};

export default Navbar;