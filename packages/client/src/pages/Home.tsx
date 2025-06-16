/* eslint-disable @stylistic/max-len */
/* eslint-disable no-console */
import React from 'react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './home.css';
import { Student } from './StudentSelect';
import { PastEval } from './PastEvaluations';

const fetchUrl = `http://localhost:${3001}`;

const assignSemester = (): string => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time to midnight

  const year = today.getFullYear();
  const summerStart = new Date(year, 4, 12); // May 12
  const summerEnd = new Date(year, 7, 9); // August 9
  const fallStart = new Date(year, 7, 25); // August 25
  const fallEnd = new Date(year, 11, 5); // December 5
  const springStart = new Date(year, 0, 12); // January 12 of next year
  const springEnd = new Date(year, 3, 24); // April 24 of next year

  if (today >= summerStart && today <= summerEnd) {
    return `SUMMER`;
  } else if (today >= fallStart && today <= fallEnd) {
    return `FALL`;
  } else if (today >= springStart && today <= springEnd) {
    return `SPRING`;
  }

  console.log(`unknown semester`, today < summerStart, today > summerEnd);
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
  const navigate = useNavigate();

  const [ user, setUser ] = useState<User | null>(null);
  const [ isLoading, setIsLoading ] = useState(true);
  const [ error, setError ] = useState<string | null>(null);
  const [ students, setStudents ] = useState<Student[]>([]);

  // const students: User[] = [];

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
        console.log(`jsonData: `, JSON.stringify(jsonData, null, 2));

        if (jsonData && jsonData.user) {
          setUser({
            email: jsonData.user.email,
            evalsCompleted: jsonData.user.evaluationsCompleted.length,
            evalsGiven: jsonData.user.evaluationsGiven || null,
            name: jsonData.user.name,
            role: jsonData.user.role,
            teamIDs: [ 2, 1 ],
            // jsonData.user.teamIDs || null
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
      document.documentElement.style.setProperty(`--gridLayout`, `'header header'\n'profile stats'\n'actions actions'`);
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
          console.log(`inside`);
          console.log(`jsonData.students: `, jsonData.students);
          const allStudents = jsonData.students as Student[];
          console.log(`allStudents: `, allStudents);
          console.log(`user.id`, user?.email);
          console.log(user?.teamIDs[0]);
          console.log(allStudents[0].teams[0].id);
          console.log(user?.teamIDs[0] === allStudents[0].teams[0].id);
          const tempFilteredStudents = allStudents.filter(
            (student) => student.teams.some((team) => user?.teamIDs?.includes(team.id)),
          );
          setStudents(tempFilteredStudents);
        }
      } catch (err) {
        if (err instanceof Error) {
          // console.log(`user fetch error: ${err.message}`);
          throw new Error(`Error while fetching students: ${err.message}`);
        } else {
          // console.log(`an unknown user fetch error`);
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
        {/* Display Team Info if available */}
        {user.teamNames &&
          <div className="info-item">
            <span className="info-label">Teams:</span>
            <span className="info-value">{user.teamNames.length > 0 ? user.teamNames : `Not Assigned`}</span>
          </div>}
        {/* Optional: Add a link to profile settings or detailed view */}
        <div className="profile-actions">
          <button onClick={() => navigate(`/profile`)} className="btn small-btn tertiary-btn">View Full Profile</button>
        </div>
      </section>

      <section className="user-stats-section">
        <h2>Your Progress</h2>
        <div className="user-stats">
          <div className="stat">
            <h2>{user.evalsCompleted}</h2>
            <p>Evaluations Completed</p>
          </div>
          {/* Add more stats here as needed, e.g., 'Evaluations Due', 'Team Members Evaluated' */}
          {/* <div className="stat">
              <h2>5</h2>
              <p>Pending Evaluations</p>
            </div> */}
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
                    // const status = studentsEvalStatus[student.id];
                    // Check if the supervisor has completed the eval. Default to false if status is not yet loaded.
                    // const isCompleted = status ? status.supervisorCompleted : false;
                      <tr
                        key={student.id}
                        // className={selectedStudentId === student.id ? `selected` : ``}
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
                className="btn secondary-btn"
              >Start New Evaluation</button>
              <button onClick={() => navigate(`/student_select`)} className="btn tertiary-btn">View Reports</button>
            </>}
          {/* Add more buttons based on roles and available routes */}
        </div>
      </section>
    </main>
  </div>;
};

export default Home;
