/* eslint-disable @stylistic/max-len */
// FOR REFERENCE THE SCROLL ITEMS WILL ONLY SHOW 1 BUT WILL ADD MORE AS THEY ADD EVALUATIONS FOR EXAMPLE, 1 evaluation equals 1 button, however if they have 2 it will show 2 buttons.
import React from 'react';
import './PastEvaluations.css';

const PastEvaluations: React.FC = () =>
  <>
    <div className="top-bar">
      <div className="left-section">
        <div className="horizontal-scroll">
          <button className="scroll-item">1</button>
          <button className="scroll-item">2</button>
          <button className="scroll-item">3</button>
          <button className="scroll-item">4</button>
          <button className="scroll-item">5</button>
          <button className="scroll-item">6</button>
          <button className="scroll-item">7</button>
          <button className="scroll-item">8</button>
          <button className="scroll-item">9</button>
        </div>
      </div>

      <div className="right-section">
        <label htmlFor="semester" className="semester-label">Semester:</label>
        <select id="semester" className="dropdown">
          <option value="spring">Spring</option>
          <option value="fall">Fall</option>
          <option value="summer">Summer</option>
        </select>
      </div>
    </div>

    <div className="past-evaluations-container">
      <div className="eval-form">
        <h2>Eval form</h2>
        <div className="info-box">Team: these will automatically fill to whatever they are whenever forms actually get submitted later </div>
        <div className="info-box">Supervisor: these will automatically fill to whatever they are whenever forms actually get submitted later </div>
        <div className="form-contents"> The actual form will go here</div>
      </div>
    </div>
  </>;
export default PastEvaluations;
