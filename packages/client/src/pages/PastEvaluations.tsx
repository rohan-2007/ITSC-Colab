/* eslint-disable react/jsx-wrap-multilines */
/* eslint-disable @stylistic/max-len */
// FOR REFERENCE THE SCROLL ITEMS WILL ONLY SHOW 1 BUT WILL ADD MORE AS THEY ADD EVALUATIONS FOR EXAMPLE, 1 evaluation equals 1 button, however if they have 2 it will show 2 buttons.
import React, { useEffect, useRef, useState } from 'react';
import './PastEvaluations.css';
import { useLocation } from 'react-router';
import { assignSemester } from './evaluations';
import '../components/buttonandcard.css';

interface Data {
  role: string;
  studentId: number | null;
}

export interface Contribution {
  contribution_count: number;
  date: string;
  user_login: string;
}

export interface Criteria {
  criteriaLevels: CriteriaLevel[];
  levels: string[];
  name: string;
  subCriteria: SubCriteria[];
  title: string | null;
}

export interface SubCriteria {
  name: string;
}

export interface CriteriaLevel {
  description: string;
  level: Level;
}

export interface Level {
  name: string;
  title: string;
}

export interface PastEval {
  id: number;
  createdAt: string;
  criteria: JSON;
  semester: string;
  studentId: number;
  supervisorId: number | null;
  team: string;
  type: string;
  updatedAt: string;
  year: number;
}

// interface Student {
//   id: number;
//   email: string;
//   name: string;
//   password: string;
// }

export interface User {
  id: number;
  email: string;
  evalsGiven: PastEval | null;
  role: `STUDENT` | `SUPERVISOR`;
  supervisorId: number | null;
  supervisorName: string;
  teamNames?: string[] | null;
}

// type PerformanceLevel = `starting` | `inProgress` | `competitive`;

const PastEvaluations: React.FC = () => {
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

  const topBarRef = useRef<HTMLDivElement>(null);

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
  const [ criteria, setCriteria ] = useState<Criteria[]>([]);
  const [ filteredStudentEvals, setFilteredStudentEvals ] = useState<PastEval[]>([]);
  const [ filteredStudentSemesterEvals, setFilteredStudentSemesterEvals ] = useState<PastEval[]>([]);
  const [ filteredSupervisorSemesterEvals, setFilteredSupervisorSemesterEvals ] = useState<PastEval[]>([]);
  const [ filteredSupervisorEvals, setFilteredSupervisorEvals ] = useState<PastEval[]>([]);
  const [ evaluationsReady, setEvaluationsReady ] = useState(false);
  const [ selectedSemester, setSelectedSemester ] = useState(`SUMMER`);
  const [ selectedYear, setSelectedYear ] = useState(2025);
  const [ selectedTeam, setSelectedTeam ] = useState(``);
  const [ filteredStudentYearEvals, setFilteredStudentYearEvals ] = useState<PastEval[]>([]);
  const [ filteredSupervisorYearEvals, setFilteredSupervisorYearEvals ] = useState<PastEval[]>([]);
  const [ filteredStudentTeamEvals, setFilteredStudentTeamEvals ] = useState<PastEval[]>([]);
  const [ filteredSupervisorTeamEvals, setFilteredSupervisorTeamEvals ] = useState<PastEval[]>([]);
  const [ user, setUser ] = useState<User | null>(null);
  const [ contributions, setContributions ] = useState<Contribution[]>();

  const rubricData = criteria.map((item) => ({
    id: item.name,
    descriptions: item.criteriaLevels.map((level) => level.description),
    levels: item.criteriaLevels.map((level) => level.level.name),
    subCriteria: item.subCriteria.map((element) => element.name),
    title: item.title,
  }));

  console.log(`criteria[0].levels: `, criteria[0]);

  // console.log(`rubricData: `, rubricData);

  // id: item.id,
  //   levels: {
  //     competitive: `Demonstrates outstanding adaptability to new situations and challenges.`,
  //     inProgress: `Adapts to new situations effectively.`,
  //     starting: `Resists change and struggles to adapt to new situations.`,
  //   },
  //   subCriteria: [ `Problem solving`, `Adaptability` ],
  //   title: `Critical Thinking/Problem Solving`,

  // const [ studentSearch, setStudentSearch ] = useState(``);
  // const [ selectedStudentId, setSelectedStudentId ] = useState<number | null>(null);
  // const [ students, setStudents ] = useState<Student[]>([]);
  // const [ isLoading, setIsLoading ] = useState(true);

  const location = useLocation();
  const data = location.state as Data;

  const handleSelectedSemester = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSemester(event.target.value);
    // setSelectedTeam(filteredStudentSemesterEvals ? filteredStudentSemesterEvals[0].team : filteredSupervisorSemesterEvals[0].team);
  };

  const handleSelectedTeam = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTeam(event.target.value);
  };

  const handleSelectedYear = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedYear(parseInt(event.target.value, 10));
    // setSelectedSemester(filteredStudentYearEvals ? filteredStudentYearEvals[0].semester : filteredSupervisorYearEvals[0].semester);
  };

  useEffect(() => {
    const handleResize = () => {
      if (topBarRef.current) {
        // setTopBarHeight(topBarRef.current.offsetHeight);
        const height = topBarRef.current.offsetHeight;
        document.documentElement.style.setProperty(`--topBarHeight`, `${height}px`);
      }
    };

    handleResize();

    window.addEventListener(`resize`, handleResize); // Update on resize

    return () => {
      window.removeEventListener(`resize`, handleResize); // Cleanup on unmount
    };
  }, []);

  useEffect(() => {
    const getGitData = async () => {
      try {
        const username = user?.email.slice(user.email.indexOf(`@`) + 1);

        console.log(`username: `, user);

        const res = await fetch(`http://localhost:3001/gitData/`, {
          body: JSON.stringify({ username }),
          credentials: `include`,
          headers: {
            'Content-Type': `application/json`,
          },
          method: `POST`,
        });

        const resJson = await res.json();

        const contributionList = resJson.contributions as Contribution[];

        setContributions(contributionList.filter((item) => getSemesterFromTimestamp(item.date) === assignSemester()));

        console.log(`gitData: `, contributions);
      } catch (err) {
        if (err instanceof Error) {
          throw new Error(`git fetch error: ${err.message}`);
        } else {
          throw new Error(`an unknown git fetch error`);
        }
      }
    };

    void getGitData();
  }, [ user ]);

  const getSemesterFromTimestamp = (timestamp: string | Date) => {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    if (date >= new Date(year, 4, 12) && date <= new Date(year, 7, 9)) {
      return `SUMMER`;
    }
    if (date >= new Date(year, 7, 25) && date <= new Date(year, 11, 5)) {
      return `FALL`;
    }
    if (date >= new Date(year, 0, 12) && date <= new Date(year, 3, 24)) {
      return `SPRING`;
    }
    return `UNKNOWN`;
  };

  const addGitContributions = () => {

  };

  const getCriteriaData = async () => {
    try {
      const res = await fetch(`http://localhost:3001/criteriaData/`, {
        headers: {
          'Content-Type': `application/json`,
        },
        method: `POST`,
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const resJson = await res.json();

      const criteriaData = resJson.criteria as Criteria[];
      console.log(`criteriaData: `, criteriaData);
      setCriteria(criteriaData);
    } catch (err) {
      if (err instanceof Error) {
        throw new Error(`user fetch error: ${err.message}`);
      } else {
        throw new Error(`an unknown user fetch error`);
      }
    }
  };

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
        email: resJson.user.email,
        evalsGiven: resJson.user.evaluationsGiven,
        role: resJson.user.role,
        supervisorId: resJson.user.supervisorId || null,
        supervisorName: resJson.user.supervisorName,
        teamNames: resJson.user.teamNames,
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

      return pastEvalsJson;
    } catch (err) {
      if (err instanceof Error) {
        throw new Error(`user fetch error: ${err.message}`);
      } else {
        throw new Error(`an unknown user fetch error`);
      }
    }
  };
  // void getPastEvals();

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
        void getCriteriaData();
        const evals = await getPastEvals();
        // void getGitData();
        console.log(`evals: `, evals);
        if (user?.role === `SUPERVISOR`) {
          const supervisorEvals = evals.filter((e) => e.supervisorId === user.id);
          setPastEvals(supervisorEvals);
        } else {
          setPastEvals(evals);
        }

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

        setFilteredStudentTeamEvals(studentEvals.filter(
          (entry) => entry.semester === selectedSemester && entry.year === selectedYear && entry.team === selectedTeam,
        ));
        setFilteredSupervisorTeamEvals(supervisorEvals.filter(
          (entry) => entry.semester === selectedSemester && entry.year === selectedYear && entry.team === selectedTeam,
        ));

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
    };

    void fetchPastEvals();
  }, [ selectedSemester, selectedYear, selectedTeam ]);

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
  void getCriteriaData();
  // void getGitData();

  const distinctYears = Array.from(new Set(pastEvals.map((item) => item.year)));
  console.log(`filteredStudentTeamEvals :${JSON.stringify(filteredStudentTeamEvals)}`);

  return <>
    <div className="top-bar" ref={topBarRef}>
      <div className="left-section">
        <h3 className="semester-label">Year:</h3>
        <select id="semester" className="dropdown" value={selectedYear} onChange={handleSelectedYear}>
          {distinctYears.map((year) =>
            <option value={year}>{year}</option>)}
        </select>
        <h3 className="semester-label">Semester:</h3>
        <select id="semester" className="dropdown" value={selectedSemester} onChange={handleSelectedSemester}>
          <option value="" />
          {filteredStudentYearEvals.concat(filteredSupervisorYearEvals).length > 0 ?
            Array.from(new Set(filteredStudentYearEvals.concat(filteredSupervisorYearEvals).map((item) => item.semester))).map((element) =>
              <option value={element}>{element}</option>) : null}
        </select>
        <h3 className="semester-label">Team:</h3>
        <select id="semester" className="dropdown" value={selectedTeam} onChange={handleSelectedTeam}>
          <option value="" />
          {filteredStudentSemesterEvals.concat(filteredSupervisorSemesterEvals).length > 0 ?
            Array.from(new Set(filteredStudentSemesterEvals.concat(filteredSupervisorSemesterEvals).map((item) => item.team))).map((element) =>
              <option value={element}>{element}</option>) : null}
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

      {/* <div className="right-section">
        <div className="horizontal-scroll">
          {filteredStudentYearEvals.length > 0 || filteredSupervisorYearEvals.length > 0 ?
            (filteredStudentYearEvals.length > filteredSupervisorYearEvals.length ? filteredStudentYearEvals : filteredSupervisorYearEvals).map((evalItem: PastEval) =>
              // const timestamp = new Date(evalItem.createdAt);
              // const year = timestamp.getFullYear();
              <button className="scroll-item" onClick={() => handleSelectedSemester(evalItem.semester)}>{evalItem.semester} {evalItem.year}</button>) : null}
        </div>
      </div> */}
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
              {rubricData[0].levels.map((element) => <th>{element}</th>)}
            </tr>
          </thead>
          <tbody>
            {rubricData.map((criterion) =>
              <tr key={criterion.id}>
                <td className="criteria-column">
                  <strong>{criterion.title}</strong>
                  <ul>
                    {criterion.subCriteria?.map((sub, index) =>
                      <li key={index}>{sub}</li>)}
                  </ul>
                </td>
                {criterion.levels.map(

                  (level, index) => {
                    let cellClass = `display-cell`;
                    const performanceLevels = criteria[0].levels;
                    type PerformanceLevel = typeof performanceLevels[number];
                    type Selections = Record<string, PerformanceLevel>;
                    console.log(`filteredStudentTeamEvals: `, filteredStudentTeamEvals);
                    console.log(`Level: `, level);
                    // console.log(`filteredStudentTeamEvals[0].criteria as unknown as Selections.[criterion.id]: `, (filteredStudentTeamEvals[0].criteria as unknown as Selections)?.[criterion.id])
                    // const selectedLevel = (evaluation.criteria as unknown as Selections)?.[criterion.id];
                    if ((filteredStudentTeamEvals[0] && filteredSupervisorTeamEvals[0]) && ((filteredStudentTeamEvals[0].criteria as unknown as Selections)?.[criterion.id] === level && (filteredSupervisorTeamEvals[0].criteria as unknown as Selections)?.[criterion.id] === level)) {
                      console.log(`both-selected`);
                      cellClass += ` both-selected`;
                    } else if (filteredStudentTeamEvals[0] && ((filteredStudentTeamEvals[0].criteria as unknown as Selections)?.[criterion.id] === level)) {
                      console.log(`student-selected`);
                      cellClass += ` student-selected`;
                    } else if (filteredSupervisorTeamEvals[0] && (filteredSupervisorTeamEvals[0].criteria as unknown as Selections)?.[criterion.id] === level) {
                      console.log(`supervisor-selected`);
                      cellClass += ` supervisor-selected`;
                    } else {
                      console.log(`in else`);

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
                          {criterion.descriptions[index]}
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
