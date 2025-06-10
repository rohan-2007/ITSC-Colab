/* eslint-disable jsx-a11y/alt-text */
// src/components/Navbar.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';
import logo from '../assets/ITSC_LOGO.png';

const Navbar: React.FC = () =>
  <header className="navbar">
    <img src={logo} className="navbar-logo" />
    <nav className="nav-links">
      <Link to="/">Home</Link>
      <Link to="/evaluations">Evaluations</Link>
      <Link to="/profile">Profile</Link>
    </nav>
    <div />
  </header>;
export default Navbar;
