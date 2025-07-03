/* eslint-disable no-console */
import React, { useEffect, useRef, useState } from 'react';
import './PastEvaluations.css';
import '../CSS/FilterEvaluations.css';
import { useLocation } from 'react-router';
import '../components/ButtonAndCard.css';
import { useNavigate } from 'react-router';
import type { Data } from './PastEvaluations';

export interface UserData {
  role: string;
  studentId: number | null;
}

export interface Student {
  id: number;
  createdAt: string;
  email: string;
  name: string;
  password: string;
  role: string;
  supervisorId: number;
  teams: Team[];
  updatedAt: string;
}

interface Team {
  id: number;
  createdAt: string;
  name: string;
  updatedAt: string;
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
  team: string;
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
  username?: string;
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
  const [ displayedEvaluations, setDisplayedEvaluations ] = useState<Evaluation[]>([]);
  // const [ rubricCategories, setRubricCategories ] = useState<RubricCategory[]>([]);
  // const [ filteredStudentEvals, setFilteredStudentEvals ] = useState<Evaluation[]>([]);
  // const [ filteredSupervisorEvals, setFilteredSupervisorEvals ] = useState<Evaluation[]>([]);
  const [ selectedSemester, setSelectedSemester ] = useState(``);
  const [ selectedYear, setSelectedYear ] = useState<number>();
  const [ selectedTeam, setSelectedTeam ] = useState(``);
  const [ selectedStudent, setSelectedStudent ] = useState<string>();
  const [ user, setUser ] = useState<User | null>(null);
  const [ loading, setLoading ] = useState(true);
  const [ isSupervisor, setIsSupervisor ] = useState(false);
  const [ students, setStudents ] = useState<Student[]>();

  console.log(`Selected year: `, selectedYear);

  useEffect(() => {
    if (data.role === `SUPERVISOR`) {
      setIsSupervisor(true);
    }
  }, [ data.role ]);
  // const [ uniqueEvals, setUniqueEvals ] = useState<Evaluation[]>();
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

  const handleSelectedStudent = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedStudent(event.target.value);
  };

  const navigateToPastEvals = (evaluation: Evaluation) => {
    const info: Data = {
      role: isSupervisor ? `SUPERVISOR` : `STUDENT`, semester: evaluation.semester,
      studentId: evaluation.studentId, team: evaluation.team, year: evaluation.year,
    };
    void navigate(`/past_evaluations`, { state: info });
  };

  useEffect(() => {
    const fetchStudents = async () => {
      if (!user) {
        return;
      }

      try {
        const response = await fetch(`http://localhost:3001/students/`, {
          credentials: `include`,
          headers: { 'Content-Type': `application/json` },
          method: `POST`,
        });

        if (!response.ok) {
          console.error(`Failed to fetch students`);
          return;
        }

        const jsonData = await response.json();

        console.log(`outside`);
        if (jsonData?.students) {
          console.log(`inside`);
          setStudents(jsonData.students as Student[]);
          console.log(`students fetched`);
        }
        setLoading(false);
      } catch (err) {
        console.error(`Student fetch error:`, err);
      } finally {
        setLoading(false);
      }
    };

    void fetchStudents();
  });

  useEffect(() => {
    if (!topBarRef.current) {
      return;
    }

    const observer = new ResizeObserver(() => {
      const height = topBarRef.current!.offsetHeight;
      document.documentElement.style.setProperty(`--topBarHeight`, `${height}px`);
    });

    observer.observe(topBarRef.current);

    return () => observer.disconnect();
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
        username: userJson.user.name,
      });

      // const targetUserId = data?.role === `SUPERVISOR` && data.studentId ? data.studentId : userId;

      console.log(`studentId: `, data);
      let evalRes;
      if (data.role === `SUPERVISOR`) {
        console.log(`data.studentId: `, data.studentId);
        evalRes = await fetch(`http://localhost:3001/getSupervisorEvals/?id=${data.studentId}`, {
          credentials: `include`,
          method: `GET`,
        });
        console.log(`evalRes`, JSON.stringify(evalRes, null, 2));
      } else {
        console.log(`student`);
        evalRes = await fetch(`http://localhost:3001/getEval/?userId=${userJson.user.id}`, {
          credentials: `include`,
          method: `GET`,
        });
        console.log(`evalRes`, JSON.stringify(evalRes, null, 2));
      }

      if (!evalRes.ok) {
        throw new Error(`HTTP error! status: ${evalRes.status}`);
      }

      let evaluationsData: Evaluation[] = await evalRes.json();
      if (data.role === `SUPERVISOR`) {
        evaluationsData = evaluationsData.filter((item) => item.supervisorId === data.studentId);
      }
      const seen = new Set();
      // setUniqueEvals(Array.from(new Set(evaluationsData.map((item) =>
      //   `${item.semester} ${item.year} Team: ${item.team}`))));
      // console.log(`evaluationsData: `, );
      setEvaluations(evaluationsData.filter((item) => {
        const key = `${item.year} ${item.semester} ${item.team} ${item.studentId}`;
        if (seen.has(key)) {
          return false;
        }
        seen.add(key);
        return true;
      }));
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
    setDisplayedEvaluations(evaluations);
  }, [ evaluations ]);

  // useEffect(() => {
  //   const studentEvals = evaluations.filter((evaluation) => evaluation.type === `STUDENT`);
  //   const supervisorEvals = evaluations.filter((evaluation) => evaluation.type === `SUPERVISOR`);

  //   setFilteredStudentEvals(studentEvals);
  //   setFilteredSupervisorEvals(supervisorEvals);
  // }, [ evaluations, selectedSemester, selectedYear, selectedTeam ]);

  useEffect(() => {
    setDisplayedEvaluations(
      evaluations.filter(
        (item) =>
          (!selectedYear || item.year === selectedYear) &&
          (!selectedSemester || item.semester === selectedSemester) &&
          (!selectedTeam || item.team === selectedTeam) &&
          (!selectedStudent ||
            item.studentId === students?.filter((student) => student.name === selectedStudent)[0].id),
      ),
    );
  }, [ evaluations, selectedYear, selectedStudent, selectedSemester, selectedTeam, students ]);

  // useEffect(() => {
  //   setDisplayedEvaluations(evaluations.filter((item) => item.semester === selectedSemester));
  // }, [ selectedSemester ]);

  // useEffect(() => {
  //   setDisplayedEvaluations(evaluations.filter((item) => item.team === selectedTeam));
  // }, [ selectedTeam ]);

  if (loading && user?.role !== `SUPERVISOR`) {
    return <div>Loading...</div>;
  }

  console.log(`evals: `, evaluations);

  const distinctYears = Array.from(new Set(evaluations.map((item) => item.year)));
  const distinctSemesters = Array.from(new Set(evaluations.map((item) => item.semester)));
  const distinctTeams = Array.from(new Set(evaluations.map((item) => item.team)));
  const distinctStudents = students?.filter((student) =>
    Array.from(new Set(evaluations.map((item) => item.studentId))).includes(student.id));

  console.log(`distinctStudents: `, distinctStudents);
  console.log(`students: `, students);

  // const filteredStudentSemesterEvals = filteredStudentEvals.filter(
  //   (evaluation) => evaluation.semester === selectedSemester && evaluation.year === selectedYear,
  // );

  // const filteredSupervisorSemesterEvals = filteredSupervisorEvals.filter(
  //   (evaluation) => evaluation.semester === selectedSemester && evaluation.year === selectedYear,
  // );

  // const filteredStudentTeamEvals = filteredStudentSemesterEvals.filter(
  //   (evaluation) => evaluation.team === selectedTeam,
  // );

  // const filteredSupervisorTeamEvals = filteredSupervisorSemesterEvals.filter(
  //   (evaluation) => evaluation.team === selectedTeam,
  // );

  // const filteredStudentYearEvals = filteredStudentEvals.filter(
  //   (evaluation) => evaluation.year === selectedYear,
  // );

  // const filteredSupervisorYearEvals = filteredSupervisorEvals.filter(
  //   (evaluation) => evaluation.year === selectedYear,
  // );

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

  return <div>
    <div className="top-bar" ref={topBarRef}>
      <div className="section">
        <div className="label-select-div">
          <h3 className="semester-label">Year:</h3>
          <select
            id="year"
            className={`dropdown-eval ${!selectedYear ? `default-option` : ``}`}
            value={selectedYear}
            onChange={handleSelectedYear}
          >
            <option value="">Select year</option>
            {distinctYears.map((year) =>
              <option key={year} value={year}>{year}</option>)}
          </select>
        </div>

        <div className="label-select-div">
          <h3 className="semester-label">Semester:</h3>
          <select
            id="semester"
            className={`dropdown-eval ${!selectedSemester ? `default-option` : ``}`}
            value={selectedSemester}
            onChange={handleSelectedSemester}
          >
            <option value="" className="default-option">Select semester</option>
            {distinctSemesters.map((semester) =>
              <option key={semester} value={semester}>{semester}</option>)}
          </select>
        </div>

        <div className="label-select-div">
          <h3 className="semester-label">Team:</h3>
          <select
            id="team"
            className={`dropdown-eval ${!selectedTeam ? `default-option` : ``}`}
            value={selectedTeam}
            onChange={handleSelectedTeam}
          >
            <option value="" className="default-option">Select team</option>
            {distinctTeams.map((team) =>
              <option key={team} value={team}>{team}</option>)}
          </select>
        </div>

        {isSupervisor &&
          <div className="label-select-div">
            <h3 className="semester-label">Student:</h3>
            <select
              id="student"
              className={`dropdown-eval ${!selectedStudent ? `default-option` : ``}`}
              value={selectedStudent}
              onChange={handleSelectedStudent}
            >
              <option value="" className="default-option">Select student</option>
              {distinctStudents?.map((student) =>
                <option key={student.name} value={student.name}>{student.name}</option>)}
            </select>
          </div>}
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

    <section className="filter-evals-container">
      {/* {displayedEvaluations?.map((item) =>
        <button className="filter-evals-button" onClick={() => navigateToPastEvals(item)}>
          {item.semester} {item.year} Team: {item.team}</button>)} */}

      <div className="eval-table-container">
        <table className="eval-select-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Semester</th>
              <th>Year</th>
              <th>Team</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {displayedEvaluations && displayedEvaluations.length > 0 ?
              displayedEvaluations.map((item) =>
                <tr>
                  <td className="display-cell">
                    <div className="level-text">
                      {isSupervisor ? distinctStudents?.filter(
                        (student) => student.id === item.studentId,
                      )[0].name : user?.username}
                    </div>
                  </td>
                  <td className="display-cell">
                    <div className="level-text">
                      {item.semester}
                    </div>
                  </td>
                  <td className="display-cell">
                    <div className="level-text">
                      {item.year}
                    </div>
                  </td>
                  <td className="display-cell">
                    <div className="level-text">
                      {item.team}
                    </div>
                  </td>
                  <td>
                    <button className="filter-evals-button" onClick={() => navigateToPastEvals(item)}>
                      view</button>
                  </td>
                </tr>) :
              <tr>
                <td colSpan={5}>No past evaluations</td>
              </tr>}
          </tbody>
        </table>
      </div>
    </section>
  </div>;
};

export default FilterEvaluations;
