import React from 'react';
import '../CSS/Contact.css';
import itscLogo from '/ITSC_LOGO.png';
import '../components/ButtonAndCard.css';

const Contact: React.FC = () =>
  <div className="contact-page">
    <h1 className="contact-title">Need Help?</h1>
    <h2 className="contact-description">
      Please contact us for any problems you experience,
      <br />
      or read the Frequently Asked Questions for common issues.
    </h2>

    <div className="button-row">
      <button
        style={{ fontSize: `20px`, height: `50px`, width: `150px` }}
        className="button-email-contact"
        onClick={() => window.location.href = `mailto:mail@example.org`}
      >
        Email
      </button>
      <button
        style={{ fontSize: `20px`, height: `50px`, width: `150px` }}
        className="button-second-contact"
      >
        FAQ
      </button>
    </div>

    <div className="logo-container">
      <img src={itscLogo} alt="ITSC Logo" className="itsc-logo" />
    </div>
  </div>;
export default Contact;
