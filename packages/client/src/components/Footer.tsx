/* eslint-disable jsx-a11y/alt-text */
import React from 'react';
import './Footer.css';
import logo from '../assets/UC_PERFORMANCE_REVIEW_LOGO.png';

const Footer: React.FC = () => <footer className="footer">
  <img src={logo} className="footer-logo" />
  © 2025 My App
</footer>;

export default Footer;
