import React, { useRef } from 'react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../CSS/home.css';
import * as d3 from 'd3';
import type { Contribution } from '../pages/PastEvaluations';
import { Evaluation } from './PastEvaluations';
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

const getMonthFromTimestamp = (timestamp: string | Date) => {
  const date = new Date(timestamp);
  return date.toLocaleString(`default`, { month: `long` });
};

const createLocalDate = (dateString: string | number | Date) => {
  const date = new Date(dateString);
  return new Date(date.getTime() + date.getTimezoneOffset() * 60000);
};

const currentSemester = assignSemester();

interface PastEval {
  semester: string;
  studentId: number;
  supervisorId: number;
  type: string;
  year: number;
}

interface TeamAverageContribution {
  average_contributions: number;
  date: string;
}

interface Team {
  id: number;
  name: string;
  primarySupervisor: { name: string };
  primarySupervisorId: number;
}

interface User {
  id: number;
  email: string;
  evalsCompleted: number;
  evalsGiven: PastEval[] | null;
  name: string;
  role: string;
  teams: Team[] | null;
}

const Home: React.FC = () => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const navigate = useNavigate();

  const [ user, setUser ] = useState<User | null>(null);
  const [ evaluations, setEvaluations ] = useState<Evaluation[]>([]);
  const [ isLoading, setIsLoading ] = useState(true);
  const [ error, setError ] = useState<string | null>(null);
  const [ students, setStudents ] = useState<Student[]>([]);
  const [ graphData, setGraphData ] = useState<Array<{ x: Date, y: number }>>();
  const [ height, setHeight ] = useState<number>(200);
  const [ width, setWidth ] = useState<number>(400);
  const [ contributions, setContributions ] = useState<Contribution[] | null>(null);
  const [ teamAverageData, setTeamAverageData ] = useState<Array<{ x: Date, y: number }> | null>(null);
  const [ months, setMonths ] = useState<string[]>();

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        return;
      }

      const res = await fetch(`http://localhost:3001/getEval/?userId=${user.id}`, {
        credentials: `include`,
      });
      const data = await res.json();
      setEvaluations(data as Evaluation[]);
    };

    if (user && user.role === `STUDENT`) {
      void fetchData();
    }
  }, [ user ]);

  useEffect(() => {
    if (svgRef.current && graphData && width && height && months && contributions) {
      setWidth(svgRef.current.clientWidth);
      setHeight(svgRef.current.clientHeight);

      const margin = { bottom: 30, left: 40, right: 20, top: 20 };
      const innerWidth = width - margin.left - margin.right;
      const innerHeight = height - margin.bottom - margin.top;

      const svg = d3.select(svgRef.current);
      svg.selectAll(`*`).remove();

      const allXValues = [ ...graphData.map((d) => d.x), ...teamAverageData ? teamAverageData.map((d) => d.x) : [] ];
      const allYValues = [ ...graphData.map((d) => d.y), ...teamAverageData ? teamAverageData.map((d) => d.y) : [] ];
      if (allXValues.length === 0) {
        return;
      }

      const xScale = d3.scaleTime().domain(d3.extent(allXValues) as [Date, Date]).range([ 0, innerWidth ]);
      const maxY = d3.max(allYValues) ?? 0;
      const yScale = d3.scaleLinear().domain([ 0, Math.max(maxY + 5, 5) ]).range([ innerHeight, 0 ]);
      graphData.sort((a, b) => a.x.getTime() - b.x.getTime());
      teamAverageData?.sort((a, b) => a.x.getTime() - b.x.getTime());

      const teamDataMap = new Map(teamAverageData?.map((item) => [ item.x.getTime(), item.y ]));

      const line = d3
        .line<{ x: Date, y: number }>()
        .x((d) => xScale(d.x))
        .y((d) => yScale(d.y))
        .curve(d3.curveCardinal);

      const g = svg.append(`g`).attr(`transform`, `translate(${margin.left},${margin.top})`);

      const xAxis = d3.axisBottom(xScale)
        .ticks(5)
        .tickFormat((domainValue: Date | d3.NumberValue) => {
          const date = domainValue instanceof Date ? domainValue : new Date(domainValue as number);
          return d3.timeFormat(`%b %d`)(createLocalDate(date));
        });
      g.append(`g`).attr(`transform`, `translate(0, ${innerHeight})`).call(xAxis);
      g.append(`g`)
        .call(
          d3.axisLeft(yScale)
            .ticks(5)
            .tickSize(-innerWidth)
            .tickPadding(10),
        )
        .selectAll(`.tick line`)
        .attr(`stroke`, `#e0e0e0`);

      if (teamAverageData && teamAverageData.length > 0) {
        g.append(`path`)
          .datum(teamAverageData)
          .attr(`fill`, `none`)
          .attr(`stroke`, `orange`)
          .attr(`stroke-width`, 2)
          .attr(`stroke-dasharray`, `5,5`)
          .attr(`d`, line);

        g.selectAll(`.team-points`)
          .data(teamAverageData)
          .enter()
          .append(`circle`)
          .attr(`cx`, (d) => xScale(d.x))
          .attr(`cy`, (d) => yScale(d.y))
          .attr(`r`, 4)
          .attr(`fill`, `orange`);
      }

      g.append(`path`)
        .datum(graphData)
        .attr(`fill`, `none`)
        .attr(`stroke`, `teal`)
        .attr(`stroke-width`, 2)
        .attr(`d`, line);

      g.selectAll(`.user-points`)
        .data(graphData)
        .enter()
        .append(`circle`)
        .attr(`cx`, (d) => xScale(d.x))
        .attr(`cy`, (d) => yScale(d.y))
        .attr(`r`, 4)
        .attr(`fill`, `teal`);

      const focusLine = g.append(`line`)
        .attr(`stroke`, `gray`)
        .attr(`stroke-width`, 1)
        .attr(`y1`, 0)
        .attr(`y2`, innerHeight)
        .style(`opacity`, 0);

      g.append(`rect`)
        .attr(`width`, innerWidth)
        .attr(`height`, innerHeight)
        .attr(`fill`, `none`)
        .attr(`pointer-events`, `all`)
        .on(`mousemove`, (event: MouseEvent) => {
          const [ mouseX ] = d3.pointer(event);
          const xDate = xScale.invert(mouseX);

          const bisectDate = d3.bisector((d: typeof graphData[0]) => d.x).center;
          const i = bisectDate(graphData, xDate);
          const d = graphData[i];

          if (!d) {
            return;
          }

          const teamValue = teamDataMap.get(d.x.getTime()) || 0;

          focusLine
            .attr(`x1`, xScale(d.x))
            .attr(`x2`, xScale(d.x))
            .style(`opacity`, 1);

          d3.select(`#tooltip`)
            .style(`opacity`, 1)
            .html(`📅 ${d3.timeFormat(`%b %d, %Y`)(d.x)}<br/>
                   👤 You: ${d.y.toFixed(2)}<br/>
                   👥 Team Avg: ${teamValue.toFixed(2)}`)
            .style(`left`, `${event.pageX + 10}px`)
            .style(`top`, `${event.pageY - 28}px`);
        })
        .on(`mouseout`, () => {
          focusLine.style(`opacity`, 0);
          d3.select(`#tooltip`).style(`opacity`, 0);
        });

      const legend = svg.append(`g`).attr(`transform`, `translate(${margin.left + 20}, ${margin.top - 10})`);
      legend.append(`line`)
        .attr(`x1`, 0)
        .attr(`y1`, 0)
        .attr(`x2`, 20)
        .attr(`y2`, 0)
        .attr(`stroke`, `teal`)
        .attr(`stroke-width`, 2);
      legend.append(`text`)
        .attr(`x`, 25)
        .attr(`y`, 0)
        .text(`Your Contributions`)
        .style(`font-size`, `12px`)
        .attr(`alignment-baseline`, `middle`);
      if (teamAverageData && teamAverageData.length > 0) {
        legend.append(`line`)
          .attr(`x1`, 140)
          .attr(`y1`, 0)
          .attr(`x2`, 160)
          .attr(`y2`, 0)
          .attr(`stroke`, `orange`)
          .attr(`stroke-width`, 2)
          .attr(`stroke-dasharray`, `5,5`);
        legend.append(`text`)
          .attr(`x`, 165)
          .attr(`y`, 0)
          .text(`Team Average`)
          .style(`font-size`, `12px`)
          .attr(`alignment-baseline`, `middle`);
      }
    }
  }, [ contributions, graphData, height, months, teamAverageData, width ]);

  useEffect(() => {
    const getGitData = async () => {
      try {
        const username = user?.name;
        const teamIDs = user?.teams ? user.teams.map((team) => team.id) : [];

        if (!username || username === undefined) {
          return;
        }

        const res = await fetch(`http://localhost:3001/gitData/`, {
          body: JSON.stringify({ teamIDs, username }),
          credentials: `include`,
          headers: {
            'Content-Type': `application/json`,
          },
          method: `POST`,
        });

        const resJson = await res.json();

        const userContributionList = (resJson.data.userContributions as Contribution[]).map((item: Contribution) => ({
          ...item,
          date: createLocalDate(item.date).toISOString(),
        }));

        const teamAverageList = (
          resJson.data.teamAverageContributions as TeamAverageContribution[]
        ).map(
          (item: TeamAverageContribution) => ({
            ...item,
            date: createLocalDate(item.date),
          }),
        );

        setContributions(userContributionList);

        const processedTeamData = teamAverageList.map((item) => ({
          x: new Date(item.date),
          y: item.average_contributions,
        }));
        setTeamAverageData(processedTeamData);
      } catch {
        return;
      }
    };

    if (user?.role === `STUDENT`) {
      void getGitData();
    }
  }, [ user ]);

  useEffect(() => {
    setMonths(Array.from(new Set(contributions?.map((item) => getMonthFromTimestamp(item.date)))));

    setGraphData(contributions?.map((item) => ({
      x: new Date(item.date),
      y: item.contribution_count,
    })));
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
            teams: jsonData.user.teams || null,
          });
        }
      } catch {
        setError(`Failed to load user data. Please try again.`);
      } finally {
        setIsLoading(false);
      }
    };

    void checkSession();
  }, [ navigate ]);

  useEffect(() => {
    if (user) {
      const safeUserData = {
        id: user.id,
        name: user.name,
        role: user.role,
        teamNames: user.teams ? user.teams.map((team) => team.name) : [],
      };
      localStorage.setItem(`userMeta`, JSON.stringify(safeUserData));
    }
  }, [ user ]);

  useEffect(() => {
    if (user?.role === `SUPERVISOR`) {
      document.documentElement.style.setProperty(
        `--gridLayout`,
        `'header header'\n'profile to-do'\n'stats to-do'`,
      );
    } else {
      document.documentElement.style.setProperty(
        `--gridLayout`,
        `'header header'\n` +
        `'graph graph'\n` +
        `'profile stats'\n` +
        `'actions actions'`,
      );
    }

    const fetchTeamStudents = async () => {
      if (user?.role !== `SUPERVISOR`) {
        return;
      }
      try {
        const response = await fetch(`http://localhost:3001/students/`, {
          credentials: `include`,
          headers: { 'Content-Type': `application/json` },
          method: `POST`,
        });

        if (!response.ok) {
          return;
        }

        const jsonData = await response.json();

        if (jsonData && jsonData.students) {
          const allStudents = jsonData.students as Student[];
          setStudents(allStudents);
        }
      } catch {
        return;
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
        {user.teams &&
          <div className="info-item">
            <span className="info-label">Teams:</span>
            <span className="info-value">
              {user.teams.length > 0 ?
                user.teams.map((team) => team.name).join(`, `) :
                `Not Assigned`}
            </span>
          </div>}
        <div className="profile-actions">
          <button onClick={() => navigate(`/profile`)} className="button-view-profile">View Full Profile</button>
        </div>
      </section>

      {user.role === `SUPERVISOR` && <section className="user-stats-section">
        <h2>Your Progress</h2>
        <div className="user-stats home-stats">
          <div className="stat">
            <h2>{user.evalsCompleted}</h2>
            <p>Evaluations Completed</p>
          </div>
        </div>
        <div className="profile-actions">
          <button onClick={() => navigate(`/evaluations`)} className="button-view-profile">Evaluations</button>
        </div>
      </section>}
      {user.role === `STUDENT` &&
        <section className="user-stats-section">
          <h2>To-Do List</h2>
          <div className="user-stats-b">
            <div className="todo-table-container">
              <table className="student-select-table">
                <thead>
                  <tr>
                    <th>Team ID</th>
                    <th>Team Name</th>
                    <th>Primary Supervisor</th>
                    <th>Completed</th>
                  </tr>
                </thead>
                <tbody>
                  {user.teams && user.teams.length > 0 ?
                    user.teams.map((team) => {
                      const primarySupervisorName = team.primarySupervisor?.name || `Unknown`;

                      const completed = evaluations.some((e) =>
                        e.studentId === user.id &&
                        e.team === team.name &&
                        e.semester === currentSemester &&
                        e.year === new Date().getFullYear() &&
                        e.type === `STUDENT` &&
                        (`teamId` in e ? (e as any).teamId === team.id : true));

                      const navUrl = `/evaluations?evaluation=open&team=${encodeURIComponent(team.name)}`;

                      return <tr key={team.id}>
                        <td>{team.id}</td>
                        <td>{team.name ?? `Unknown`}</td>
                        <td>{primarySupervisorName}</td>
                        <td>
                          {completed ?
                            `✅` :
                            <button onClick={() => navigate(navUrl)}>
                              Go To
                            </button>}
                        </td>
                      </tr>;
                    }) :
                    <tr>
                      <td colSpan={4} className="no-students-message">
                        No teams found.
                      </td>
                    </tr>}
                </tbody>

              </table>
            </div>
          </div>
        </section>}

      {user.role === `STUDENT` && <section className="graph-section">
        <h2>Git Contributions</h2>
        {contributions && contributions.length > 0 ?
          <div className="graph-div">
            <svg ref={svgRef} className="graph" />
            <div id="tooltip" />
          </div> :
          <p>No past contributions for this month</p>}
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
                            <td>
                              {student.teams
                                .filter((t) =>
                                  user.teams?.some((ut) => ut.id === t.id))
                                .map((team) => team.name)
                                .join(`, `)}
                            </td> :
                            <td>No team</td>}
                          <td>
                            {user.evalsGiven?.some((evaluation) =>
                              evaluation.studentId === student.id &&
                              evaluation.supervisorId === user.id &&
                              evaluation.type === `SUPERVISOR` &&
                              evaluation.semester === currentSemester &&
                              evaluation.year === new Date().getFullYear()) ? `✅` : `❌`}
                          </td>
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
