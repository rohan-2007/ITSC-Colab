/* eslint-disable jsx-a11y/anchor-is-valid */
import React from 'react';
import './evaluations.css';


const App = () =>
 <div className="app">
   <header className="navbar">
     <div className="navbar-left">
       <img src="/ITSC_LOGO.png" alt="ITSC Logo" />
     </div>
     <div className="navbar-center">
       <button>Home</button>
     </div>
     <div className="navbar-right">
       <h1>Evaluations</h1>
     </div>
   </header>


   <main className="main-content" />


   <footer className="footer">
     <div className="footer-left">
       <img src="/PR_LOGO.png" alt="PR Logo" />
     </div>
     <div className="footer-center">
       <span>Link one</span>
       <span>Link two</span>
       <span>Link three</span>
       <span>Link four</span>
     </div>
     <div className="footer-right" />
   </footer>


   <div className="footer-bottom">
     © 2025 ITSC Performance Review. All rights reserved.
     {` `}
     <a href="#">Privacy Policy</a>
     {` `}
     |
     {` `}
     <a href="#">Terms of Service</a>
   </div>
 </div>;


export default App;
