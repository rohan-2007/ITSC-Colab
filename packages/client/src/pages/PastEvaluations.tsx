/* eslint-disable react/jsx-wrap-multilines */
/* eslint-disable @stylistic/max-len */
// FOR REFERENCE THE SCROLL ITEMS WILL ONLY SHOW 1 BUT WILL ADD MORE AS THEY ADD EVALUATIONS FOR EXAMPLE, 1 evaluation equals 1 button, however if they have 2 it will show 2 buttons.
import React, { useEffect, useState } from 'react';
import './PastEvaluations.css';
import { useLocation } from 'react-router';

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

interface Data {
  role: string;
  studentId: number | null;
}

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
    year: number;
  }

  interface Student {
    id: number;
    email: string;
    name: string;
    password: string;
  }

  // interface LegendItem {
  //   color: string;
  //   label: string;
  // }

  // interface CSSProperties {
  //   [key: `--${string}`]: string | number;
  // }

  const studentBgColor = `#abadb0`;
  const studentBorderColor = `#97f04a`;
  const supervisorBgColor = `#a5c4f2`;
  const supervisorBorderColor = `#e36864`;
  const bothBgColor = `#3e84ed`;
  const bothBorderColor = `#e0bb63`;

  const dynamicStyles: React.CSSProperties = {
    '--bothBgColor': bothBgColor,
    '--bothBorderColor': bothBorderColor,
    '--studentBgColor': studentBgColor,
    '--studentBorderColor': studentBorderColor,
    '--supervisorBgColor': supervisorBgColor,
    '--supervisorBorderColor': supervisorBorderColor,
  } as React.CSSProperties;

  const legendColors = [
    { color: studentBgColor, label: `Student` },
    { color: supervisorBgColor, label: `Supervisor` },
    { color: bothBgColor, label: `Supervisor and Student` },
  ];

  const [ pastEvals, setPastEvals ] = useState<PastEval[]>([]);
  const [ filteredStudentEvals, setFilteredStudentEvals ] = useState<PastEval[]>([]);
  const [ filteredStudentSemesterEvals, setFilteredStudentSemesterEvals ] = useState<PastEval[]>([]);
  const [ filteredSupervisorSemesterEvals, setFilteredSupervisorSemesterEvals ] = useState<PastEval[]>([]);
  const [ filteredSupervisorEvals, setFilteredSupervisorEvals ] = useState<PastEval[]>([]);
  const [ evaluationsReady, setEvaluationsReady ] = useState(false);
  const [ selectedSemester, setSelectedSemester ] = useState(``);
  const [ selectedYear, setSelectedYear ] = useState(2025);
  const [ filteredStudentYearEvals, setFilteredStudentYearEvals ] = useState<PastEval[]>([]);
  const [ filteredSupervisorYearEvals, setFilteredSupervisorYearEvals ] = useState<PastEval[]>([]);
  const [ user, setUser ] = useState<User | null>(null);
  const [ studentSearch, setStudentSearch ] = useState(``);
  const [ selectedStudentId, setSelectedStudentId ] = useState<number | null>(null);
  const [ students, setStudents ] = useState<Student[]>([]);
  // const [ isLoading, setIsLoading ] = useState(true);

  const location = useLocation();
  const data = location.state as Data;
  console.log(`data: `, data);

  const handleSelectedSemester = (semester: string) => {
    setSelectedSemester(semester);
  };

  const handleSelectedYear = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedYear(parseInt(event.target.value, 10));
    setSelectedSemester(filteredStudentYearEvals ? filteredStudentYearEvals[0].semester : filteredSupervisorYearEvals[0].semester);
  };

  useEffect(() => {
    // console.log(selectedYear);
    // handleSelectedSemester(filteredStudentYearEvals ? filteredStudentYearEvals[0].semester : filteredSupervisorYearEvals[0].semester);
  }, [ selectedYear ]);

  const getPastEvals = async () => {
    // console.log(`getPastEvals`);
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

      // console.log(`user data: `, JSON.stringify(resJson, null, 2));

      const userId = resJson.user.id;

      setUser({
        id: resJson.user.id,
        role: resJson.user.role,
        supervisorId: resJson.user.supervisorId || null,
        supervisorName: resJson.user.supervisorName,
      });

      let evalResponse;

      if (data && data.role === `SUPERVISOR`) {
        evalResponse = await fetch(`http://localhost:3001/getEval/?userId=${data.studentId}`, {
          credentials: `include`,
          method: `GET`,
        });
      } else {
        evalResponse = await fetch(`http://localhost:3001/getEval/?userId=${userId}`, {
          credentials: `include`,
          method: `GET`,
        });
      }

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

  // console.log(selectedSemester);

  useEffect(() => {
    // const fetchUser = async () => {
    //   try {
    //     const response = await fetch(`${fetchUrl}/me/`, {
    //       body: JSON.stringify({ returnData: true }),
    //       credentials: `include`,
    //       headers: { 'Content-Type': `application/json` },
    //       method: `POST`,
    //     });
    //     if (!response.ok) {
    //       throw new Error(`Session not found. Please log in.`);
    //     }
    //     const data = await response.json();
    //     setUser({
    //       id: data.user.id,
    //       role: data.user.role,
    //       supervisorId: data.user.supervisorId || null,
    //       supervisorName: data.user.supervisorName,
    //     });
    //   } catch (err) {
    //     // eslint-disable-next-line no-console
    //     console.error(`Failed to fetch user data: ${err instanceof Error ? err.message : String(err)}`);
    //   } finally {
    //     setIsLoading(false);
    //   }
    // };
    // void fetchUser();

    const fetchPastEvals = async () => {
      try {
        const evals = await getPastEvals();
        setPastEvals(evals);
        const studentEvals = evals.filter(
          // (entry) => entry.type === `STUDENT` && entry.semester === `${selectedSemester}`,
          (entry) => entry.type === `STUDENT`,
        );
        const supervisorEvals = evals.filter(
          // (entry) => entry.type === `SUPERVISOR` && entry.semester === `${selectedSemester}`,
          (entry) => entry.type === `SUPERVISOR`,
        );
        setFilteredStudentEvals(studentEvals);

        // console.log(`Filtered student evaluations: `, filteredStudentEvals);
        setFilteredSupervisorEvals(supervisorEvals);

        // console.log(`Filtered supervisor evaluations: `, supervisorEvals);
        setFilteredStudentSemesterEvals(studentEvals.filter(
          (entry) => entry.semester === selectedSemester && entry.year === selectedYear,
        ));
        setFilteredSupervisorSemesterEvals(supervisorEvals.filter(
          (entry) => entry.semester === selectedSemester && entry.year === selectedYear,
        ));

        setFilteredStudentYearEvals(studentEvals.filter(
          (entry) => entry.year === selectedYear,
        ));
        setFilteredSupervisorYearEvals(supervisorEvals.filter(
          (entry) => entry.year === selectedYear,
        ));
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error);
      }
      // eslint-disable-next-line no-console
      console.log(`here`);
    };

    void fetchPastEvals();
  }, [ selectedSemester, selectedYear ]);

  useEffect(() => {
    if (filteredStudentEvals.length || filteredSupervisorEvals.length) {
      setEvaluationsReady(true);
    }
  }, [ filteredStudentEvals, filteredSupervisorEvals ]);

  if (!evaluationsReady && (user?.role !== `SUPERVISOR`)) {
    return <div>Loading...</div>;
  }

  // console.log(`filteredStudentEvals`, filteredStudentEvals);
  // console.log(`filteredStudentSemesterEvals`, filteredStudentSemesterEvals);

  // const timestamp = new Date((filteredStudentSemesterEvals[0] ? filteredStudentSemesterEvals[0] : filteredSupervisorSemesterEvals[0]).createdAt);
  // const year = timestamp.getFullYear();

  // useEffect(() => {
  //   // eslint-disable-next-line no-console
  //   console.log(`Updated filteredStudentEvals:`, filteredStudentEvals);
  //   // eslint-disable-next-line no-console
  //   console.log(`Updated filteredSupervisorEvals:`, filteredSupervisorEvals);
  // }, [ filteredStudentEvals, filteredSupervisorEvals ]);

  // console.log(`filtered student evals`, filteredStudentEvals);

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

  interface User {
    id: number;
    role: `STUDENT` | `SUPERVISOR`;
    supervisorId: number | null;
    supervisorName: string;
  }

  const distinctYears = Array.from(new Set(pastEvals.map((item) => item.year)));

  return <>
    <div className="top-bar">
      <div className="left-section">
        <label className="semester-label">Year:</label>
        <select id="semester" className="dropdown" value={selectedYear} onChange={handleSelectedYear}>
          {distinctYears.map((year) =>
            <option value={year}>{year}</option>)}
        </select>
      </div>

      <div className="legend-outer">
        {legendColors.map((item, index) =>
          <div key={index} className="legend-item-container">
            <div
              style={{
                backgroundColor: item.color,
                height: `16px`,
                marginRight: `8px`,
                width: `16px`,
              }}
            />
            <span>{item.label}</span>
          </div>)}
      </div>

      <div className="right-section">
        <div className="horizontal-scroll">
          {filteredStudentYearEvals.length > 0 || filteredSupervisorYearEvals.length > 0 ?
            (filteredStudentYearEvals.length > filteredSupervisorYearEvals.length ? filteredStudentYearEvals : filteredSupervisorYearEvals).map((evalItem: PastEval) =>
              // const timestamp = new Date(evalItem.createdAt);
              // const year = timestamp.getFullYear();
              <button className="scroll-item" onClick={() => handleSelectedSemester(evalItem.semester)}>{evalItem.semester} {evalItem.year}</button>) : null}
        </div>
      </div>
    </div>

    {/* <div className="past-evaluations-container">
>>>>>>> 0d0790eb8238005079f4bdc25be2d7be6bc5aa35
      <div className="eval-form">
        <h2>Eval form</h2>
        <div className="info-box">Team: these will automatically fill to whatever they are whenever forms actually get submitted later </div>
        <div className="info-box">Supervisor: these will automatically fill to whatever they are whenever forms actually get submitted later </div>
        <div className="form-contents"> The actual form will go here</div>
      </div>

    </div> */}

    {/* {filteredStudentEvals.length > 0 && filteredSupervisorEvals.length > 0 ?
      filteredStudentEvals.map((evaluation: PastEval, evalIndex) => { */}
    <section className="past-evals-container">
      {/* <h2>{filteredStudentSemesterEvals[0] ? filteredStudentSemesterEvals[0].semester : filteredSupervisorSemesterEvals[0].semester} {filteredStudentSemesterEvals[0] ? filteredStudentSemesterEvals[0].year : filteredSupervisorSemesterEvals[0].year}</h2> */}
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

                  (level) => {
                    let cellClass = `display-cell`;

                    // const selectedLevel = (evaluation.criteria as unknown as Selections)?.[criterion.id];
                    if ((filteredStudentSemesterEvals[0] && filteredSupervisorSemesterEvals[0]) && ((filteredStudentSemesterEvals[0].criteria as unknown as Selections)?.[criterion.id] === level && (filteredSupervisorSemesterEvals[0].criteria as unknown as Selections)?.[criterion.id] === level)) {
                      cellClass += ` both-selected`;
                    } else if (filteredStudentSemesterEvals[0] && ((filteredStudentSemesterEvals[0].criteria as unknown as Selections)?.[criterion.id] === level)) {
                      cellClass += ` student-selected`;
                    } else if (filteredSupervisorSemesterEvals[0] && (filteredSupervisorSemesterEvals[0].criteria as unknown as Selections)?.[criterion.id] === level) {
                      cellClass += ` supervisor-selected`;
                    } else {
                      cellClass = String(cellClass);
                    }
                    return (
                      <td
                        key={level}
                        style={dynamicStyles}
                        className={cellClass}
                        // onClick={() => handleSelect(criterion.id, level)}
                      >
                        <div className="level-text">
                          {criterion.levels[level]}
                        </div>
                      </td>);
                  },
                )}
              </tr>)}
          </tbody>
        </table>
      </div>
    </section>

  </>;
};

export default PastEvaluations;
