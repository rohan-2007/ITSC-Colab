/* eslint-disable @typescript-eslint/no-base-to-string */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import React, { useState } from 'react';
import './evaluations.css';

const Evaluations: React.FC = () => {
  const PORT = 3001;

  const handleEvalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log(`f`);
    console.log(`criteria1: ${criteria1}`);
    console.log(`criteria2: ${criteria2}`);

    try {
      const res = await fetch(`http://localhost:${PORT}/me/`, {
        credentials: `include`,
        method: `POST`,
      });

      const resJson = await res.json();
      if (!res.ok) {
        throw new Error(resJson.message || `user session not found`);
      }
      console.log(`abba: ${resJson}`);

      const evalData = {
        criteria: {
          criteria1,
          criteria2,
        },
        evaluationType: resJson.user.role,
        semester: `FALL`,
        supervisorId: resJson.user.supervisorId,
        userId: resJson.user.userId,
      };

      console.log(`bbbbb${evalData}`);

      const response = await fetch(`http://localhost:${PORT}/submitEval/`, {
        body: JSON.stringify(evalData),
        credentials: `include`,
        headers: { 'Content-Type': `application/json` },
        method: `POST`,
      });
    } catch (err) {
      if (err instanceof Error) {
        setMessage(`Evaluation submit error: ${err.message}`);
      } else {
        setMessage(`An unknown error occured`);
      }
    }
  };

  const [ message, setMessage ] = useState(``);
  const [ criteria1, setCriteria1 ] = useState(`starting`);
  const [ criteria2, setCriteria2 ] = useState(`competitive`);

  return <div className="evalContainer">
    <form>
      <fieldset className="criteria">
        <legend>Critical Thinking/Problem Solving:</legend>
        <label className="evaluation-btn">
          <input
            type="radio"
            name="criteria1"
            value="starting"
            checked={criteria1 === `starting`}
            onChange={(e) => setCriteria1(e.target.value)}
          />
          Starting
        </label>
        <label className="evaluation-btn">
          <input
            type="radio"
            name="criteria1"
            value="inProgress"
            checked={criteria1 === `inProgress`}
            onChange={(e) => setCriteria1(e.target.value)}
          />
          In Progress
        </label>
        <label className="evaluation-btn">
          <input
            type="radio"
            name="criteria1"
            value="competitive"
            checked={criteria1 === `competitive`}
            onChange={(e) => setCriteria1(e.target.value)}
          />
          Competitive
        </label>
      </fieldset>

      <fieldset className="criteria">
        <legend>Technical Proficiency:</legend>
        <label className="evaluation-btn">
          <input
            type="radio"
            name="criteria2"
            value="starting"
            checked={criteria2 === `starting`}
            onChange={(e) => setCriteria2(e.target.value)}
          />
          Starting
        </label>
        <label className="evaluation-btn">
          <input
            type="radio"
            name="criteria2"
            value="inProgress"
            checked={criteria2 === `inProgress`}
            onChange={(e) => setCriteria2(e.target.value)}
          />
          In Progress
        </label>
        <label className="evaluation-btn">
          <input
            type="radio"
            name="criteria2"
            value="competitive"
            checked={criteria2 === `competitive`}
            onChange={(e) => setCriteria2(e.target.value)}
          />
          Competitive
        </label>
      </fieldset>

      <button type="submit" onClick={handleEvalSubmit}>Submit</button>
    </form>

    {/* <span>Teamwork:</span>
      <div className="evaluation-btn-group">
        <div className="evaluation-btn">
          Starting
        </div>
        <div className="evaluation-btn">
          In Progress
        </div>
        <div className="evaluation-btn">
          Competitive
        </div>
      </div>
      <span>Personal Disposition:</span>
      <div className="evaluation-btn-group">
        <div className="evaluation-btn">
          Starting
        </div>
        <div className="evaluation-btn">
          In Progress
        </div>
        <div className="evaluation-btn">
          Competitive
        </div>
      </div> */}
  </div>;
};

export default Evaluations;
