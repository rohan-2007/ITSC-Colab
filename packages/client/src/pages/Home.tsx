/* eslint-disable @stylistic/max-len */
/* eslint-disable no-console */
import React, { useRef } from 'react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../CSS/home.css';
import * as d3 from 'd3';
import type { Contribution } from '../pages/PastEvaluations';
import { Student } from './StudentSelect';
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

const getMonthFromTimestamp = (timestamp: string | Date) => {
  const date = new Date(timestamp);
  return date.toLocaleString(`default`, { month: `long` });
};

const checkIfCurrentYear = (timestamp: string | Date) => {
  const date = new Date(timestamp);
  return date.getFullYear() === new Date().getFullYear();
};

const currentSemester = assignSemester();

interface PastEval {
  semester: string;
  studentId: number;
  supervisorId: number;
  type: string;
  year: number;
}

interface User {
  id: number;
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
  const [ graphData, setGraphData ] = useState<Array<{ x: Date, y: number }>>();
  const [ height, setHeight ] = useState<number>(200);
  const [ width, setWidth ] = useState<number>(400);
  const [ contributions, setContributions ] = useState<Contribution[] | null>(null);
  const [ months, setMonths ] = useState<string[]>();

  useEffect(() => {
    console.log(`contributions: `, contributions);
    if (svgRef.current && graphData && width && height && months && contributions) {
      console.log(`graphData: `, graphData);
      setWidth(svgRef.current.clientWidth);
      setHeight(svgRef.current.clientHeight);
      const margin = { bottom: 20, left: 20, right: 20, top: 20 };
      const innerWidth = width - margin.left - margin.right;
      const innerHeight = height - margin.bottom - margin.top;
      console.log(`width:`, innerWidth, `height:`, innerHeight);
      const svg = d3.select(svgRef.current);
      const xScale = d3.scaleTime().domain((d3.extent(graphData, (d) => d.x)) as [Date, Date]).range([ 0, innerWidth + margin.left ]);
      const yScale = d3.scaleLinear().domain([ 0, Math.max(...graphData.map((d) => d.y)) + 5 ]).range([ innerHeight, 0 ]);
      graphData.sort((a, b) => a.x.getTime() - b.x.getTime());
      const line = d3.line<{ x: Date, y: number }>().x((d) => xScale(d.x)).y((d) => yScale(d.y)).curve(d3.curveCardinal);

      svg.selectAll(`*`).remove();
      // const targetTickSpacing = 60; // pixels per tick
      // const tickCount = Math.floor(innerWidth / targetTickSpacing);
      const g = svg.append(`g`);
      const dateLabels = contributions.map((d) => new Date(d.date));
      const xAxis = d3.axisBottom(xScale)
        .ticks(graphData.length)
        .tickFormat((d, i) => {
          const date = dateLabels[i];
          return d3.timeFormat(`%b %d`)(date);
        });

      const focusLine = g.append(`line`)
        .attr(`stroke`, `gray`)
        .attr(`stroke-width`, 1)
        .attr(`y1`, 0)
        .attr(`y2`, innerHeight)
        .style(`opacity`, 0);

      svg.append(`rect`)
        .attr(`width`, innerWidth)
        .attr(`height`, innerHeight)
        .attr(`fill`, `none`)
        .attr(`pointer-events`, `all`)
        .on(`mousemove`, (event: MouseEvent) => {
          const [ x ] = d3.pointer(event);
          focusLine
            .attr(`x1`, x)
            .attr(`x2`, x)
            .style(`opacity`, 1);

          // Optional: snap to nearest point
          const xDate = xScale.invert(x); // for scaleTime
          const i = d3.bisector((d: typeof graphData[0]) => d.x).center(graphData, xDate);
          const d = graphData[i];

          // You can now move your tooltip to d.x, d.y
          d3.select(`#tooltip`)
            .style(`opacity`, 1)
            .html(`📅 ${d3.timeFormat(`%b %d, %Y`)(d.x)}<br/>📊 ${d.y} contributions`)
            .style(`left`, `${event.pageX + 10}px`)
            .style(`top`, `${event.pageY - 28}px`);
        })
        .on(`mouseout`, () => {
          focusLine.style(`opacity`, 0);
          d3.select(`#tooltip`).style(`opacity`, 0);
        });
      // g.append(`path`).datum(graphData).attr(`d`, line).attr(`fill`, `none`).attr(`stroke`, `teal`).attr(`stroke-width`, 2);
      g.selectAll(`circle`)
        .data(graphData)
        .enter()
        .append(`circle`)
        .attr(`cx`, (d) => xScale(d.x))
        .attr(`cy`, (d) => yScale(d.y))
        .attr(`r`, 4)
        .attr(`fill`, `teal`)
        .on(`mouseover`, (event, d) => {
          d3.select(`#tooltip`)
            .style(`opacity`, 1)
            .html(`📅 ${d3.timeFormat(`%b %d, %Y`)(d.x)}<br/>📊 ${d.y} contributions`)
            .style(`left`, `${event.pageX + 10}px`)
            .style(`top`, `${event.pageY - 28}px`);
        })
        .on(`mouseout`, () => {
          d3.select(`#tooltip`).style(`opacity`, 0);
        });
      g.append(`path`)
        .datum(graphData)
        .attr(`fill`, `none`)
        .attr(`stroke`, `teal`)
        .attr(`stroke-width`, 2)
        .attr(`d`, line);
      g.append(`g`).attr(`transform`, `translate(${margin.left}, ${innerHeight})`).call(xAxis);
      g.append(`g`).call(d3.axisLeft(yScale).ticks(5).tickSize(-innerWidth - margin.left).tickPadding(10));
    }
  }, [ graphData, width, height, months ]);

  useEffect(() => {
    const getGitData = async () => {
      try {
        const username = user?.email.slice(0, user.email.indexOf(`@`));

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

        setContributions(contributionList.filter((item) => getSemesterFromTimestamp(item.date) === assignSemester() && checkIfCurrentYear(item.date)));

        console.log(`filtered contributions: `, contributionList.filter((item) => getSemesterFromTimestamp(item.date) === assignSemester() && checkIfCurrentYear(item.date)));
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
    setMonths(Array.from(new Set(contributions?.map((item) => getMonthFromTimestamp(item.date)))));
    setGraphData(contributions?.map((item) => ({ x: new Date(item.date), y: item.contribution_count })));
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
            id: jsonData.user.id,
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
      document.documentElement.style.setProperty(
        `--gridLayout`,
        `'header header'\n'profile to-do'\n'stats to-do'`,
      );
    } else {
      document.documentElement.style.setProperty(`--gridLayout`, `'header header'\n'graph graph'\n'profile stats'\n'actions actions'`);
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
          setStudents(allStudents);
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
        <div className="profile-actions">
          <button onClick={() => navigate(`/evaluations`)} className="button-view-profile">Evaluations</button>
        </div>
      </section>

      {user.role === `STUDENT` && <section className="graph-section">
        <h2>Your Past Git Contributions</h2>
        {contributions && contributions.length > 0 ?
          <div className="graph-div">
            {/* <div className="stat">
              <h2>{user.evalsCompleted}</h2>
              <p>Evaluations Completed</p>
            </div> */}
            {/* <h3>contributions: {contributions}</h3> */}
            <svg ref={svgRef} className="graph" />
            <div id="tooltip" />
          </div> :
          <p>No Past Contributions</p>}
      </section>}

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
                    students
                      .filter((student) => student.supervisorId === user.id)
                      .map((student) =>
                        <tr key={student.id}>
                          <td>{student.id}</td>
                          <td>{student.name}</td>
                          <td>{student.email}</td>
                          {student.teams[0] ?
                            <td>{student.teams.filter((t) => user.teamIDs?.includes(t.id)).map((team) => team.name).join(`, `)}</td> : <td>No team</td>}
                          <td>{user.evalsGiven?.some((evaluation) =>
                            evaluation.studentId === student.id && evaluation.supervisorId === user.id && evaluation.type === `SUPERVISOR` && evaluation.semester === currentSemester && evaluation.year === new Date().getFullYear()) ? `✅` : `❌`}</td>
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
    </main>
  </div>;
};

export default Home;
