import React from 'react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './home.css';

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
  // eslint-disable-next-line no-console
  console.log(`unknown semester`, today < summerStart, today > summerEnd);
  return `UNKNOWN`;
};
const currentSemester = assignSemester();
interface User {
  email: string;
  evalsCompleted: number;
  name: string;
  role: string;
  teamId: number | null;
  teamName: string | null;
}

const Home: React.FC = () => {
  const navigate = useNavigate();

  const [ user, setUser ] = useState<User | null>(null);
  const [ isLoading, setIsLoading ] = useState(true);
  const [ error, setError ] = useState<string | null>(null);

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
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const jsonData = await response.json();

        if (jsonData && jsonData.user) {
          setUser({
            email: jsonData.user.email,
            evalsCompleted: jsonData.user.evalsCompleted || 0,
            name: jsonData.user.name,
            role: jsonData.user.role,
            teamId: jsonData.user.teamId || null,
            teamName: jsonData.user.teamName || null,
          });
        } else {
          await navigate(`/login`);
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(`[Home useEffect] Session check failed:`, err);
        setError(`Failed to load user data. Please try again.`);
        await navigate(`/login`);
      } finally {
        setIsLoading(false);
      }
    };

    void checkSession();
  }, [ navigate ]);

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
        {user.teamName &&
          <div className="info-item">
            <span className="info-label">Team:</span>
            <span className="info-value">{user.teamName}</span>
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

      <section className="quick-actions-section">
        <h2>Quick Actions</h2>
        <div className="quick-actions">
          {user.role === `STUDENT` &&
            <>
              <button onClick={() => navigate(`/`)} className="btn primary-btn">View My Evaluations</button>
              <button onClick={() => navigate(`/`)} className="btn secondary-btn">Request Feedback</button>
            </>}
          {user.role === `SUPERVISOR` &&
            <>
              <button onClick={() => navigate(`/`)} className="btn secondary-btn">Start New Evaluation</button>
              <button onClick={() => navigate(`/`)} className="btn tertiary-btn">View Reports</button>
            </>}
          {/* Add more buttons based on roles and available routes */}
        </div>
      </section>
    </main>
  </div>;
};

export default Home;
