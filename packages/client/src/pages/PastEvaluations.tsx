/* eslint-disable @stylistic/max-len */
// FOR REFERENCE THE SCROLL ITEMS WILL ONLY SHOW 1 BUT WILL ADD MORE AS THEY ADD EVALUATIONS FOR EXAMPLE, 1 evaluation equals 1 button, however if they have 2 it will show 2 buttons.
import React, { useEffect, useState } from 'react';
import './PastEvaluations.css';

type Selections = Record<string, PerformanceLevel>;

const rubricData = [
  {
    id: `criticalThinking`,
    levels: {
      competitive: `Demonstrates outstanding adaptability to new situations and challenges.`,
      inProgress: `Adapts to new situations effectively.`,
      starting: `Resists change and struggles to adapt to new situations.`,
    },
    subCriteria: [ `Problem solving`, `Adaptability` ],
    title: `Critical Thinking/Problem Solving`,
  },
  {
    id: `technicalProficiency`,
    levels: {
      competitive: `Performs complex tasks, and consistently demonstrates a high level of technical expertise.`,
      inProgress: `Capable of performing and solving problems. Can meet the technical requirements of the role.`,
      starting: `Demonstrates limited technical skills and knowledge. Struggles to perform tasks.`,
    },
    subCriteria: [ `Git (version control)`, `GitHub`, `Application admin`, `(Knowledge, Speed, Productivity)` ],
    title: `Technical Proficiency`,
  },
  {
    id: `teamwork`,
    levels: {
      competitive: `Inspires and uplifts teams to while focusing on accountability and initiative flexibility.`,
      inProgress: `Maintains team-oriented mind by being accountable, taking initiative, and being flexible on tasks.`,
      starting: `Works in isolation and avoids collaboration. Shows resistance to sharing work with others.`,
    },
    subCriteria: [ `Collaboration`, `Prioritization`, `Accountability`, `Initiative`, `Flexibility`, `Integrity` ],
    title: `Teamwork`,
  },
  {
    id: `personalDisposition`,
    levels: {
      competitive: `High interpersonal skills can be seen through conversations. Consistently meets deadlines.`,
      inProgress: `Shows good range of interpersonal skills. Displays competent skills. Provides clear direction.`,
      starting: `Low interpersonal skills. This is evident by: lack of listening, struggling to complete work on time.`,
    },
    subCriteria: [ `Communication`, `Time management`, `Organization`, `Adaptability`, `Patience` ],
    title: `Personal Disposition`,
  },
];

type PerformanceLevel = `starting` | `inProgress` | `competitive`;

const PastEvaluations: React.FC = () => {
  interface PastEval {
    id: number;
    createdAt: string;
    criteria: JSON;
    semester: string;
    studentId: number;
    supervisorId: number | null;
    type: string;
    updatedAt: string;
  }

  const [ pastEvals, setPastEvals ] = useState<PastEval[]>([]);

  const getPastEvals = async () => {
    // eslint-disable-next-line no-console
    console.log(`getPastEvals`);
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

      const evalResponse = await fetch(`http://localhost:3001/getEval/?userId=${userId}`, {
        credentials: `include`,
        method: `GET`,
      });

      if (!evalResponse.ok) {
        throw new Error(`HTTP error! status: ${evalResponse.status}`);
      }

      const pastEvalsJson: PastEval[] = await evalResponse.json();

      // eslint-disable-next-line no-console
      console.log(`past evals: `, JSON.stringify(pastEvalsJson, null, 2));

      return pastEvalsJson;
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
  // void getPastEvals();

  useEffect(() => {
    const fetchPastEvals = async () => {
      try {
        const evals = await getPastEvals();
        setPastEvals(evals);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error);
      }
    };

    void fetchPastEvals();
  }, []);

  // const pastEvals = getPastEvals();

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

    {pastEvals?.length ?
      pastEvals.map((evaluation: PastEval) =>
        evaluation.type === `STUDENT` ?
          <section className="past-evals-container">
            <h2>Your Profile</h2>
            <div className="rubric-table-wrapper">
              <table className="rubric-table">
                <thead>
                  <tr>
                    <th>Criteria</th>
                    <th>Starting</th>
                    <th>In Progress</th>
                    <th>Competitive</th>
                  </tr>
                </thead>
                <tbody>
                  {rubricData.map((criterion) =>
                    <tr key={criterion.id}>
                      <td className="criteria-column">
                        <strong>{criterion.title}</strong>
                        <ul>
                          {criterion.subCriteria.map((sub, index) =>
                            <li key={index}>{sub}</li>)}
                        </ul>
                      </td>
                      {([ `starting`, `inProgress`, `competitive` ] as PerformanceLevel[]).map(
                        (level) =>
                          <td
                            key={level}
                            className={`level-cell ${
                              (evaluation.criteria as unknown as Selections)?.[criterion.id] === level ? `selected` : ``
                            }`}
                            // onClick={() => handleSelect(criterion.id, level)}
                          >
                            <div className="level-text">
                              {criterion.levels[level]}
                            </div>
                          </td>,

                      )}
                    </tr>)}
                </tbody>
              </table>
            </div>
          </section> :
          null) :
      null}

  </>;
};
export default PastEvaluations;
