/* eslint-disable no-console */
import React, { useEffect, useRef, useState } from 'react';
import './PastEvaluations.css';
import { useLocation } from 'react-router';
import '../components/ButtonAndCard.css';
import { useNavigate } from 'react-router';
import type { Data } from './PastEvaluations';

export interface UserData {
  studentId: number | null;
}

export interface RubricCategory {
  id: number;
  displayOrder: number;
  levels: RubricPerformanceLevel[];
  name: string;
  subItems: RubricSubItem[];
  title: string;
}

export interface RubricSubItem {
  id: number;
  name: string;
  rubricCategoryId: number;
}

export interface RubricPerformanceLevel {
  id: number;
  description: string;
  level: string;
  rubricCategoryId: number;
}

export interface EvaluationResult {
  id: number;
  evaluationId: number;
  rubricCategory: RubricCategory;
  rubricCategoryId: number;
  rubricPerformanceLevel: RubricPerformanceLevel;
  rubricPerformanceLevelId: number;
}

export interface Evaluation {
  id: number;
  createdAt: string;
  results: EvaluationResult[];
  semester: string;
  studentId: number;
  supervisorId: number | null;
  team: string | null;
  type: string;
  updatedAt: string;
  year: number;
}

export interface User {
  id: number;
  email: string;
  role: `STUDENT` | `SUPERVISOR`;
  supervisorId: number | null;
  supervisorName: string;
  teamNames?: string[] | null;
}

// const assignSemester = (): `SPRING` | `SUMMER` | `FALL` | `N/A` => {
//   const today = new Date();
//   const year = today.getFullYear();
//   if (today >= new Date(year, 4, 12) && today <= new Date(year, 7, 9)) {
//     return `SUMMER`;
//   }
//   if (today >= new Date(year, 7, 25) && today <= new Date(year, 11, 5)) {
//     return `FALL`;
//   }
//   if (today >= new Date(year, 0, 12) && today <= new Date(year, 3, 24)) {
//     return `SPRING`;
//   }
//   return `N/A`;
// };

const FilterEvaluations: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const data = location.state as UserData;
  // const studentBgColor = `#abadb0`;
  // const studentBorderColor = `#97f04a`;
  // const supervisorBgColor = `#a5c4f2`;
  // const supervisorBorderColor = `#e36864`;
  // const bothBgColor = `#3e84ed`;
  // const bothBorderColor = `#e0bb63`;

  const topBarRef = useRef<HTMLDivElement>(null);

  // const dynamicStyles: React.CSSProperties = {
  //   '--bothBgColor': bothBgColor,
  //   '--bothBorderColor': bothBorderColor,
  //   '--studentBgColor': studentBgColor,
  //   '--studentBorderColor': studentBorderColor,
  //   '--supervisorBgColor': supervisorBgColor,
  //   '--supervisorBorderColor': supervisorBorderColor,
  // } as React.CSSProperties;

  // const legendColors = [
  //   { color: studentBgColor, label: `Student` },
  //   { color: supervisorBgColor, label: `Supervisor` },
  //   { color: bothBgColor, label: `Supervisor and Student` },
  // ];

  const [ evaluations, setEvaluations ] = useState<Evaluation[]>([]);
  // const [ rubricCategories, setRubricCategories ] = useState<RubricCategory[]>([]);
  const [ filteredStudentEvals, setFilteredStudentEvals ] = useState<Evaluation[]>([]);
  const [ filteredSupervisorEvals, setFilteredSupervisorEvals ] = useState<Evaluation[]>([]);
  const [ selectedSemester, setSelectedSemester ] = useState(`SUMMER`);
  const [ selectedYear, setSelectedYear ] = useState(2025);
  const [ selectedTeam, setSelectedTeam ] = useState(``);
  const [ user, setUser ] = useState<User | null>(null);
  const [ loading, setLoading ] = useState(true);
  // const [ selectedEvaluation, setSelectedEvaluation ] = useState<Evaluation>();

  const handleSelectedSemester = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSemester(event.target.value);
  };

  const handleSelectedTeam = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTeam(event.target.value);
  };

  const handleSelectedYear = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedYear(parseInt(event.target.value, 10));
  };

  const navigateToPastEvals = (evaluation: Evaluation) => {
    const info: Data = {
      role: `STUDENT`, semester: evaluation.semester,
      studentId: evaluation.studentId, team: evaluation.team, year: evaluation.year,
    };
    void navigate(`/past_evaluations`, { state: info });
  };

  // const checkIfCurrentYear = (timestamp: string | Date) => {
  //   const date = new Date(timestamp);
  //   return date.getFullYear() === new Date().getFullYear();
  // };

  useEffect(() => {
    const handleResize = () => {
      if (topBarRef.current) {
        const height = topBarRef.current.offsetHeight;
        document.documentElement.style.setProperty(`--topBarHeight`, `${height}px`);
      }
    };

    handleResize();
    window.addEventListener(`resize`, handleResize);

    return () => {
      window.removeEventListener(`resize`, handleResize);
    };
  }, []);

  // const getSemesterFromTimestamp = (timestamp: string | Date) => {
  //   const date = new Date(timestamp);
  //   const year = date.getFullYear();
  //   if (date >= new Date(year, 4, 12) && date <= new Date(year, 7, 9)) {
  //     return `SUMMER`;
  //   }
  //   if (date >= new Date(year, 7, 25) && date <= new Date(year, 11, 5)) {
  //     return `FALL`;
  //   }
  //   if (date >= new Date(year, 0, 12) && date <= new Date(year, 3, 24)) {
  //     return `SPRING`;
  //   }
  //   return `UNKNOWN`;
  // };

  // const fetchGitData = async () => {
  //   if (!user?.email) {
  //     return;
  //   }

  //   try {
  //     const username = user.email.slice(user.email.indexOf(`@`) + 1);
  //     const res = await fetch(`http://localhost:3001/gitData/`, {
  //       body: JSON.stringify({ username }),
  //       credentials: `include`,
  //       headers: { 'Content-Type': `application/json` },
  //       method: `POST`,
  //     });

  //     const resJson = await res.json();
  //     const contributionList = resJson.data as Contribution[];

  //     setContributions(contributionList.filter((item) =>
  //       getSemesterFromTimestamp(item.date) === assignSemester() && checkIfCurrentYear(item.date)));
  //   } catch (err) {
  //     console.error(`Git fetch error:`, err);
  //   }
  // };

  // const fetchRubricCategories = async () => {
  //   try {
  //     const res = await fetch(`http://localhost:3001/rubric`);

  //     if (!res.ok) {
  //       throw new Error(`HTTP error! status: ${res.status}`);
  //     }
  //     const resJson = await res.json();
  //     setRubricCategories(resJson as RubricCategory[]);
  //   } catch (err) {
  //     console.error(`Rubric categories fetch error:`, err);
  //   }
  // };

  const fetchEvaluations = React.useCallback(async () => {
    try {
      const userRes = await fetch(`http://localhost:3001/me/`, {
        body: JSON.stringify({ returnData: true }),
        credentials: `include`,
        headers: { 'Content-Type': `application/json` },
        method: `POST`,
      });

      if (!userRes.ok) {
        throw new Error(`HTTP error! status: ${userRes.status}`);
      }

      const userJson = await userRes.json();
      // const userId = userJson.user.id;

      setUser({
        id: userJson.user.id,
        email: userJson.user.email,
        role: userJson.user.role,
        supervisorId: userJson.user.supervisorId || null,
        supervisorName: userJson.user.supervisorName,
        teamNames: userJson.user.teamNames,
      });

      // const targetUserId = data?.role === `SUPERVISOR` && data.studentId ? data.studentId : userId;

      console.log(`studentId: `, data);
      const evalRes = await fetch(`http://localhost:3001/getEval/?userId=${data.studentId}`, {
        credentials: `include`,
        method: `GET`,
      });

      if (!evalRes.ok) {
        throw new Error(`HTTP error! status: ${evalRes.status}`);
      }

      const evaluationsData: Evaluation[] = await evalRes.json();
      console.log(`evaluationsData: `, evaluationsData);
      setEvaluations(evaluationsData);
    } catch (err) {
      console.error(`Evaluations fetch error:`, err);
    } finally {
      setLoading(false);
    }
  }, [ data ]);

  useEffect(() => {
    const fetchData = async () => {
      // await fetchRubricCategories();
      await fetchEvaluations();
    };
    void fetchData();
  }, [ fetchEvaluations ]);

  useEffect(() => {
    const studentEvals = evaluations.filter((evaluation) => evaluation.type === `STUDENT`);
    const supervisorEvals = evaluations.filter((evaluation) => evaluation.type === `SUPERVISOR`);

    setFilteredStudentEvals(studentEvals);
    setFilteredSupervisorEvals(supervisorEvals);
  }, [ evaluations, selectedSemester, selectedYear, selectedTeam ]);

  if (loading && user?.role !== `SUPERVISOR`) {
    return <div>Loading...</div>;
  }

  const distinctYears = Array.from(new Set(evaluations.map((item) => item.year)));

  const filteredStudentSemesterEvals = filteredStudentEvals.filter(
    (evaluation) => evaluation.semester === selectedSemester && evaluation.year === selectedYear,
  );

  const filteredSupervisorSemesterEvals = filteredSupervisorEvals.filter(
    (evaluation) => evaluation.semester === selectedSemester && evaluation.year === selectedYear,
  );

  // const filteredStudentTeamEvals = filteredStudentSemesterEvals.filter(
  //   (evaluation) => evaluation.team === selectedTeam,
  // );

  // const filteredSupervisorTeamEvals = filteredSupervisorSemesterEvals.filter(
  //   (evaluation) => evaluation.team === selectedTeam,
  // );

  const filteredStudentYearEvals = filteredStudentEvals.filter(
    (evaluation) => evaluation.year === selectedYear,
  );

  const filteredSupervisorYearEvals = filteredSupervisorEvals.filter(
    (evaluation) => evaluation.year === selectedYear,
  );

  // Convert evaluation results to a lookup map for easier access
  // const getEvaluationResults = (evaluation: Evaluation) => {
  //   const resultsMap: Record<number, number> = {};
  //   evaluation.results.forEach((result) => {
  //     resultsMap[result.rubricCategoryId] = result.rubricPerformanceLevelId;
  //   });
  //   return resultsMap;
  // };

  // const studentTeamResults = filteredStudentTeamEvals[0] ? getEvaluationResults(filteredStudentTeamEvals[0]) : {};
  // const supervisorTeamResults = filteredSupervisorTeamEvals[0] ?
  // getEvaluationResults(filteredSupervisorTeamEvals[0]) :
  // {};

  return <>
    <div className="top-bar" ref={topBarRef}>
      <div className="left-section">
        <h3 className="semester-label">Year:</h3>
        <select id="year" className="dropdown" value={selectedYear} onChange={handleSelectedYear}>
          {distinctYears.map((year) =>
            <option key={year} value={year}>{year}</option>)}
        </select>

        <h3 className="semester-label">Semester:</h3>
        <select id="semester" className="dropdown" value={selectedSemester} onChange={handleSelectedSemester}>
          <option value="" />
          {filteredStudentYearEvals.concat(filteredSupervisorYearEvals).length > 0 &&
              Array.from(
                new Set(
                  filteredStudentYearEvals.concat(filteredSupervisorYearEvals).map((item) => item.semester),
                ),
              ).map((semester) =>
                <option key={semester} value={semester}>{semester}</option>)}
        </select>

        <h3 className="semester-label">Team:</h3>
        <select id="team" className="dropdown" value={selectedTeam} onChange={handleSelectedTeam}>
          <option value="" />
          {filteredStudentSemesterEvals.concat(filteredSupervisorSemesterEvals).length > 0 &&
              Array.from(
                new Set(
                  filteredStudentSemesterEvals
                    .concat(filteredSupervisorSemesterEvals)
                    .map((item) => item.team)
                    .filter((team): team is string => typeof team === `string` && team.length > 0),
                ),
              ).map((team) =>
                <option key={team} value={team}>{team}</option>)}
        </select>
      </div>
    </div>

    {/* <section className="past-evals-container">
      <div className="rubric-table-wrapper">
        <table className="rubric-table">
          <thead>
            <tr>
              <th>Criteria</th>
              {rubricCategories[0]?.levels.map((level) =>
                <th key={level.id}>{level.level}</th>)}
            </tr>
          </thead>
          <tbody>
            {rubricCategories.map((category) =>
              <tr key={category.id}>
                <td className="criteria-column">
                  <strong>{category.title}</strong>
                  <ul>
                    {category.subItems?.map((subItem) =>
                      <li key={subItem.id}>{subItem.name}</li>)}
                  </ul>
                </td>
                {category.levels.map((level) => {
                  let cellClass = `display-cell`;

                  const studentSelected = studentTeamResults[category.id] === level.id;
                  const supervisorSelected = supervisorTeamResults[category.id] === level.id;

                  if (studentSelected && supervisorSelected) {
                    cellClass += ` both-selected`;
                  } else if (studentSelected) {
                    cellClass += ` student-selected`;
                  } else if (supervisorSelected) {
                    cellClass += ` supervisor-selected`;
                  }

                  return <td
                    key={level.id}
                    style={dynamicStyles}
                    className={cellClass}
                  >
                    <div className="level-text">
                      {level.description}
                    </div>
                  </td>;
                })}
              </tr>)}
          </tbody>
        </table>
      </div>
    </section> */}

    <section className="past-evals-container">
      {evaluations.map((item) => <div>
        <button className="semester-label" onClick={() => navigateToPastEvals(item)}>
          {item.semester} {item.year} Team: {item.team}</button>
      </div>)}
    </section>
  </>;
};

export default FilterEvaluations;
