/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable jsx-a11y/anchor-is-valid */
import React from 'react';
import './Footer.css';
import logo from '../assets/PR_LOGO.png';

const Footer: React.FC = () =>
  <footer className="footer">

    {/* <footer className="footer"> */}
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
    {/* </footer> */}
  </footer>;

export default Footer;
