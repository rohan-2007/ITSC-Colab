// import React, { useState } from 'react';
// import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
// import './App.css';

import React from 'react';

const HomePage: React.FC = () => {
  return  (
    <div className="container">
      <div>
        <img alt="UC logo"/>
      </div>
      <div>
        <button>Evaluations</button>
      </div>
      <div>
        <p>Welcome! You can view your evaluations by clicking the evaluations button</p>
      </div>
    </div>
  );
};

export default HomePage;