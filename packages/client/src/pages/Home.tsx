/* eslint-disable @stylistic/max-len */
/* eslint-disable no-console */
import React, { useRef } from 'react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../CSS/home.css';
import * as d3 from 'd3';
import type { Contribution } from '../pages/PastEvaluations';
import { Student } from './StudentSelect';
import { PastEval } from './PastEvaluations';
import '../components/ButtonAndCard.css';

const fetchUrl = `http://localhost:${3001}`;

const assignSemester = (): string => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const year = today.getFullYear();
  const summerStart = new Date(year, 4, 12);
  const summerEnd = new Date(year, 7, 9);
  const fallStart = new Date(year, 7, 25);
  const fallEnd = new Date(year, 11, 5);
  const springStart = new Date(year, 0, 12);
  const springEnd = new Date(year, 3, 24);

  if (today >= summerStart && today <= summerEnd) {
    return `SUMMER`;
  } else if (today >= fallStart && today <= fallEnd) {
    return `FALL`;
  } else if (today >= springStart && today <= springEnd) {
    return `SPRING`;
  }

  return `UNKNOWN`;
};

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

const currentSemester = assignSemester();
interface User {
  email: string;
  evalsCompleted: number;
  evalsGiven: PastEval[] | null;
  name: string;
  role: string;
  teamIDs: number[] | null;
  teamNames: [] | null;
}

const Home: React.FC = () => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const navigate = useNavigate();

  const [ user, setUser ] = useState<User | null>(null);
  const [ isLoading, setIsLoading ] = useState(true);
  const [ error, setError ] = useState<string | null>(null);
  const [ students, setStudents ] = useState<Student[]>([]);
  const [ graphData, setGraphData ] = useState<Array<{ x: number, y: number }>>();
  const [ height, _setHeight ] = useState<number>(200);
  const [ width, _setWidth ] = useState<number>(200);
  const [ contributions, setContributions ] = useState<Contribution[]>();

  useEffect(() => {
    console.log(`contributions: `, contributions);
    if (svgRef.current && graphData && width && height) {
      console.log(`heeeyy`);
      const svg = d3.select(svgRef.current);
      const xScale = d3.scaleLinear().domain([ 0, graphData.length - 1 ]).range([ 0, width ]);
      const yScale = d3.scaleLinear().domain([ 0, Math.max(...graphData.map((d) => d.y)) + 1 ]).range([ height, 0 ]);
      const line = d3.line<{ x: number, y: number }>().x((_, i) => xScale(i)).y((d) => yScale(d.y)).curve(d3.curveCardinal);

      svg.selectAll(`*`).remove();
      svg.append(`path`).datum(graphData).attr(`d`, line).attr(`fill`, `none`).attr(`stroke`, `teal`).attr(`stroke-width`, 2);
    }
  }, [ graphData ]);

  useEffect(() => {
    const getGitData = async () => {
      try {
        const username = user?.email.slice(user.email.indexOf(`@`) + 1);

        console.log(`username: `, username);

        const res = await fetch(`http://localhost:3001/gitData/`, {
          body: JSON.stringify({ username }),
          credentials: `include`,
          headers: {
            'Content-Type': `application/json`,
          },
          method: `POST`,
        });

        const resJson = await res.json();

        console.log(`resJson: `, JSON.stringify(resJson, null, 2));

        const contributionList = resJson.data as Contribution[];
        console.log(`contributionList: `, contributionList);

        setContributions(contributionList.filter((item) => getSemesterFromTimestamp(item.date) === assignSemester()));

        console.log(`filtered contributions: `, contributionList.filter((item) => getSemesterFromTimestamp(item.date) === assignSemester()));
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

  useEffect(() => {
    setGraphData(contributions?.map((item, index) => ({ x: index, y: item.contribution_count })));
  }, [ contributions ]);

  useEffect(() => {
    const checkSession = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`${fetchUrl}/me/`, {
          body: JSON.stringify({ returnData: true }),
          credentials: `include`,
          headers: { 'Content-Type': `application/json` },
          method: `POST`,
        });

        if (!response.ok) {
          await navigate(`/login`);
        }

        const jsonData = await response.json();

        if (jsonData && jsonData.user) {
          setUser({
            email: jsonData.user.email,
            evalsCompleted: jsonData.user.evaluationsCompleted.length,
            evalsGiven: jsonData.user.evaluationsGiven || null,
            name: jsonData.user.name,
            role: jsonData.user.role,
            teamIDs: jsonData.user.safeTeamIDs || null,
            teamNames: jsonData.user.teamNames || null,
          });
        }
      } catch (err) {
        console.error(`[Home useEffect] Session check failed:`, err);
        setError(`Failed to load user data. Please try again.`);
      } finally {
        setIsLoading(false);
      }
    };

    void checkSession();
  }, [ navigate ]);

  useEffect(() => {
    if (user?.role === `SUPERVISOR`) {
      document.documentElement.style.setProperty(`--gridLayout`, `'header header header'\n'profile stats to-do'\n'actions actions to-do'`);
    } else {
      document.documentElement.style.setProperty(`--gridLayout`, `'header header header'\n'profile stats graph'\n'actions actions actions'`);
    }

    const fetchTeamStudents = async () => {
      try {
        const response = await fetch(`http://localhost:3001/students/`, {
          credentials: `include`,
          headers: { 'Content-Type': `application/json` },
          method: `POST`,
        });

        if (!response.ok) {
          console.error(`Failed to fetch students`);
        }

        const jsonData = await response.json();

        if (jsonData && jsonData.students) {
          const allStudents = jsonData.students as Student[];
          const tempFilteredStudents = allStudents.filter(
            (student) => student.teams.some((team) => user?.teamIDs?.includes(team.id)),
          );
          setStudents(tempFilteredStudents);
        }
      } catch (err) {
        if (err instanceof Error) {
          throw new Error(`Error while fetching students: ${err.message}`);
        } else {
          throw new Error(`an unknown students fetch error`);
        }
      }
    };

    void fetchTeamStudents();
  }, [ user ]);

  if (isLoading) {
    return <div className="home-container">
      <main className="main-content">
        <h1>Loading user data...</h1>
        <p>Please wait.</p>
      </main>
    </div>;
  }

  if (error) {
    return <div className="home-container">
      <main className="main-content">
        <h1>Error</h1>
        <p>{error}</p>
        <button onClick={() => navigate(`/login`)}>Go to Login</button>
      </main>
    </div>;
  }

  if (!user) {
    return <div className="home-container">
      <main className="main-content">
        <h1>User data not available.</h1>
        <p>Attempting to redirect...</p>
      </main>
    </div>;
  }

  return <div className="home-container">
    <main className="main-content">
      <section className="dashboard-header">
        <h1>Welcome, {user.name}!</h1>
        <div className="current-semester-info">
          <span className="semester-label">Current Semester:</span>
          <span className="semester-value">{currentSemester} {new Date().getFullYear()}</span>
        </div>
      </section>

      <section className="profile-quick-info">
        <h2>Your Profile</h2>
        <div className="info-item">
          <span className="info-label">Name:</span>
          <span className="info-value">{user.name}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Role:</span>
          <span className="info-value">{user.role}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Email:</span>
          <span className="info-value">{user.email}</span>
        </div>
        {user.teamNames &&
          <div className="info-item">
            <span className="info-label">Teams:</span>
            <span className="info-value">{user.teamNames.length > 0 ? user.teamNames.join(`, `) : `Not Assigned`}</span>
          </div>}
        <div className="profile-actions">
          <button onClick={() => navigate(`/profile`)} className="button-view-profile">View Full Profile</button>
        </div>
      </section>

      <section className="user-stats-section">
        <h2>Your Progress</h2>
        <div className="user-stats">
          <div className="stat">
            <h2>{user.evalsCompleted}</h2>
            <p>Evaluations Completed</p>
          </div>
        </div>
      </section>

      <section className="graph-section">
        <h2>Your Past Contributions</h2>
        <div className="user-stats">
          <svg ref={svgRef} width={width} height={height} />
        </div>
      </section>

      {user.role === `SUPERVISOR` &&
        <section className="supervisor-todo-section">
          <h2>To-Do List</h2>
          <div className="user-stats">
            <div className="todo-table-container">
              <table className="student-select-table">
                <thead>
                  <tr>
                    <th>Student ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Teams</th>
                    <th>Completed</th>
                    {` `}
                  </tr>
                </thead>
                <tbody>
                  {students.length > 0 ?
                    students.map((student) =>
                      <tr
                        key={student.id}
                      >
                        <td>{student.id}</td>
                        <td>{student.name}</td>
                        <td>{student.email}</td>
                        {student.teams[0] ?
                          <td>{student.teams.filter((t) => user.teamIDs?.includes(t.id)).map((team) => team.name).join(`, `)}</td> : <td>No team</td>}
                        <td>{user.evalsGiven?.some((evaluation) => evaluation.studentId === student.id) ? `✅` : `❌`}</td>
                      </tr>) :
                    <tr>
                      <td colSpan={4} className="no-students-message">
                        No students found.
                      </td>
                    </tr>}
                </tbody>
              </table>
            </div>
          </div>
        </section>}

      <section className="quick-actions-section">
        <h2>Quick Actions</h2>
        <div className="quick-actions">
          {user.role === `STUDENT` &&
            <>
              <button
                onClick={() => navigate(`/past_evaluations`)}
                className="btn primary-btn"
              >View My Evaluations</button>
              <button onClick={() => navigate(`/`)} className="btn secondary-btn">Request Feedback</button>
            </>}
          {user.role === `SUPERVISOR` &&
            <>
              <button
                onClick={() => navigate(`/evaluations`)}
                className="button-start-eval"
              >Start New Evaluation</button>
              <button onClick={() => navigate(`/student_select`)} className="button-view-reports">View Reports</button>
            </>}
        </div>
      </section>
    </main>
  </div>;
};

export default Home;
