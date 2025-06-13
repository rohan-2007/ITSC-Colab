import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Profile.css';

const fetchUrl = `http://localhost:3001`;

interface UserProfile {
  id: number;
  createdAt: string;
  email: string;
  name: string;
  role: `SUPERVISOR` | `STUDENT` | `N/A`;
  supervisorId: number | null;
  supervisorName: string | null;
  teamNames: string | null;
}

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [ user, setUser ] = useState<UserProfile | null>(null);
  const [ isLoading, setIsLoading ] = useState(true);
  const [ error, setError ] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserInfo = async () => {
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
          throw new Error(`Session expired or invalid. Please log in again.`);
        }

        const jsonData = await response.json();

        if (jsonData && jsonData.user) {
          setUser({
            id: jsonData.user.id || -1,
            createdAt: jsonData.user.createdAt,
            email: jsonData.user.email || `N/A`,
            name: jsonData.user.name || `N/A`,
            role: jsonData.user.role || `N/A`,
            supervisorId: jsonData.user.supervisorId || null,
            supervisorName: jsonData.user.supervisorName || `Not Assigned`,
            teamNames: jsonData.user.teamNames || `Not Assigned`,
          });
        }
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError(`An unknown error occurred while fetching your profile.`);
        }
      } finally {
        setIsLoading(false);
      }
    };

    void fetchUserInfo();
  }, [ navigate ]);

  if (isLoading) {
    return <div className="profile-page-container">
      <main className="profile-content">
        <h1>Loading Profile...</h1>
        <p>Please wait while we fetch your details.</p>
      </main>
    </div>;
  }

  if (error) {
    return <div className="profile-page-container">
      <main className="profile-content">
        <h1>Error</h1>
        <p>{error}</p>
        <button onClick={() => navigate(`/login`)} className="btn primary-btn">
          Go to Login
        </button>
      </main>
    </div>;
  }

  if (!user) {
    return <div className="profile-page-container">
      <main className="profile-content">
        <h1>Profile Not Found</h1>
        <p>We could not find your profile data. Please try logging in again.</p>
        <button onClick={() => navigate(`/login`)} className="btn primary-btn">
          Go to Login
        </button>
      </main>
    </div>;
  }

  return <div className="profile-page-container">
    <header className="profile-header">
      <h1>Your Profile</h1>
      <p>Manage your personal and organizational information.</p>
    </header>
    <main className="profile-content-grid">
      <div className="profile-card profile-details-card">
        <div className="profile-avatar">{user.name.charAt(0)}</div>
        <h2>{user.name}</h2>
        <span className={`profile-role-badge role-${user.role.toLowerCase()}`}>{user.role}</span>
        <p className="profile-email">{user.email}</p>
      </div>

      <div className="profile-card profile-account-card">
        <h3>Account Information</h3>
        <div className="profile-info-item">
          <span className="info-label">Joined On</span>
          <span className="info-value">
            {
              new Date(user.createdAt).toLocaleString(`en-US`, {
                day: `numeric`,
                hour: `2-digit`,
                minute: `2-digit`,
                month: `short`,
                weekday: `short`,
                year: `numeric`,
              })
            }
          </span>
        </div>
        <div className="profile-info-item">
          <span className="info-label">Member ID</span>
          <span className="info-value">#{user.id}</span>
        </div>
        <div className="profile-info-item">
          <span className="info-label">Supervisor</span>
          <span className="info-value">{user.supervisorName}</span>
        </div>
        <div className="profile-info-item">
          <span className="info-label">Team</span>
          <span className="info-value">
            {user.teamNames && user.teamNames.length > 0 ? user.teamNames : `Not Assigned`}</span>
        </div>
      </div>

      {user.role === `SUPERVISOR` &&
        <div className="profile-card profile-actions-card">
          <h3>Account Actions</h3>
          <div className="profile-actions-buttons">
            <button className="btn secondary-btn" disabled>Edit Profile</button>
            <button className="btn tertiary-btn" disabled>Change Password</button>
            <button className="btn destructive-btn" disabled>Delete Account</button>
          </div>
        </div>}
    </main>
  </div>;
};

export default Profile;
