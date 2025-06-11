/* eslint-disable @stylistic/max-len */
// FOR REFERENCE THE SCROLL ITEMS WILL ONLY SHOW 1 BUT WILL ADD MORE AS THEY ADD EVALUATIONS FOR EXAMPLE, 1 evaluation equals 1 button, however if they have 2 it will show 2 buttons.
import React from 'react';
import './PastEvaluations.css';

const PastEvaluations: React.FC = () => {
  const getPastEvals = async () => {
    try {
      const res = await fetch(`http://localhost:3001/me/`, {
        body: JSON.stringify({ returnData: true }),
        credentials: `include`,
        headers: {
          'Content-Type': `application/json`,
        },
        method: `POST`,
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const resJson = await res.json();

      // eslint-disable-next-line no-console
      console.log(`user data: `, JSON.stringify(resJson, null, 2));

      const userId = resJson.user.id;

      const pastEvals = await fetch(`http://localhost:3001/getEval/?userId=${userId}`, {
        credentials: `include`,
        method: `GET`,
      });

      if (!pastEvals.ok) {
        throw new Error(`HTTP error! status: ${pastEvals.status}`);
      }

      const pastEvalsJson = await pastEvals.json();

      // eslint-disable-next-line no-console
      console.log(`past evals: `, JSON.stringify(pastEvalsJson, null, 2));
    } catch (err) {
      if (err instanceof Error) {
        // console.log(`user fetch error: ${err.message}`);
        throw new Error(`user fetch error: ${err.message}`);
      } else {
        // console.log(`an unknown user fetch error`);
        throw new Error(`an unknown user fetch error`);
      }
    }
  };
  void getPastEvals();
  // const resJson = await res.json();
  // if (!res.ok) {
  //   console.log(`Response not ok, throwing error`);
  //   throw new Error(resJson.message || `user session not found`);
  // }
  // console.log(`resJson: `, JSON.stringify(resJson, null, 2));

  // try {
  //   const userId = resJson.user.id;
  // } catch (error) {
  //   throw new Error(resJson.message || `user session not found`);
  // }

  // const userId = resJson.user.id;

  // const pastEvals = await fetch(`http://localhost:3001/getEval`, {
  //   body: JSON.stringify({ userId }),
  //   credentials: `include`,
  //   headers: { 'Content-Type': `application/json` },
  //   method: `POST`,
  // });

  // console.log(pastEvals);
  // return pastEvals;
  // };

  return <>
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
};
export default PastEvaluations;
