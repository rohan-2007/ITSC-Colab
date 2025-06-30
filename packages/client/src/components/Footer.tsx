import React from 'react';
import './Footer.css';

const Footer: React.FC = () => <footer className="footer">

  <footer className="footer">
    <div className="footer-content">
      <div className="footer-left">
        <img src="/PR_LOGO.png" alt="Performance Review Logo" className="footer-logo" />
      </div>
      <div className="footer-center">
        <div className="footer-bottom">
          © 2025 Your Website. All rights reserved.
          <span style={{ margin: `10px` }}> Privacy Policy </span>
          <span style={{ margin: `10px` }}> Terms of Service </span>
        </div>
      </div>
    </div>
  </footer>
</footer>;

export default Footer;
