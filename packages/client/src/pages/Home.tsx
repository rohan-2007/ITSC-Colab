/* eslint-disable jsx-a11y/anchor-is-valid */
// We can get rid of the links at the footer but if u find a use, then use it
import React from 'react';
import './home.css';

const Home: React.FC = () =>
  <div className="home-container">
    <header className="navbar">
      <div className="nav-left">
        <img src="/ITSC_LOGO.png" alt="ITSC Logo" className="logo" />
      </div>
      <div className="nav-center">
        <button className="nav-button">Evaluations</button>
      </div>
      <div className="nav-right">
        <span>Welcome User!</span>
        <button className="logout-button">Log out</button>
      </div>
    </header>

    <main className="main-content" />
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-left">
          <img src="/PR_LOGO.png" alt="Performance Review Logo" className="footer-logo" />
        </div>
        <div className="footer-center">
          <div className="footer-links">
            <a href="#">Link one</a>
            <a href="#">Link two</a>
            <a href="#">Link three</a>
            <a href="#">Link four</a>
          </div>
          <div className="footer-bottom">
            © 2025 Your Website. All rights reserved.
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  </div>;
export default Home;
