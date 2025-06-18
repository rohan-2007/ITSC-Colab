import React from 'react';
import './Contact.css';
import itscLogo from '/ITSC_LOGO.png';
import '../components/ButtonAndCard.css';

const Contact: React.FC = () =>
  <div className="contact-page">
    <h1 className="contact-title">Contact us</h1>

    <div className="button-row">
      <button className="button-email-contact">Email</button>
      <button className="button-second-contact">Button</button>
    </div>

    <p className="contact-description">
      Please contact us for any problems you may face while using our website or any problems in general.
      Also contact us for anything else you may need!
    </p>

    <div className="logo-container">
      <img src={itscLogo} alt="ITSC Logo" className="itsc-logo" />
    </div>
  </div>;
export default Contact;
