import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../CSS/Profile.css';
import '../components/buttonandcard.css';
import '../components/Modals.css';
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
  const [ showEditModal, setShowEditModal ] = useState(false);

  const [ newName, setNewName ] = useState(``);
  const [ newEmail, setNewEmail ] = useState(``);
  const [ newPassword, setNewPassword ] = useState(``);

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

  const handleSaveChanges = async () => {
    try {
      const response = await fetch(`${fetchUrl}/setUserInfo`, {
        body: JSON.stringify({
          email: newEmail,
          name: newName,
          password: newPassword,
          userId: user?.id,
        }),
        credentials: `include`,
        headers: { 'Content-Type': `application/json` },
        method: `POST`,
      });

      if (!response.ok) {
        throw new Error(`Failed to update profile.`);
      }

      setShowEditModal(false);
      window.location.reload();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
    }
  };

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
            {new Date(user.createdAt).toLocaleString(`en-US`, {
              day: `numeric`,
              hour: `2-digit`,
              minute: `2-digit`,
              month: `short`,
              weekday: `short`,
              year: `numeric`,
            })}
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
            <button className="button-edit-profile" onClick={() => setShowEditModal(true)}>
              Edit Profile
            </button>
          </div>
        </div>}
    </main>

    {showEditModal &&
      <div className="modal-overlay-profile">
        <div className="modal-content-profile">
          <h2>Edit Your Profile</h2>
          <label>
            Username:
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={user.name}
            />
          </label>
          <label>
            Email:
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder={user.email}
            />
          </label>
          <label>
            Password:
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password"
            />
          </label>
          <div className="modal-buttons">
            <button className="button-default" onClick={handleSaveChanges}>Save</button>
            <button className="button-default" onClick={() => setShowEditModal(false)}>Cancel</button>
          </div>
        </div>
      </div>}
  </div>;
};

export default Profile;
