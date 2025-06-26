import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../CSS/Profile.css';
import '../components/buttonAndCard.css';
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

interface StudentSelfEvalStatus {
  studentCompleted: boolean;
}

interface GitContribution {
  id: number;
  contribution_count: number;
  date: string;
  user_login: string;
}

const getCurrentAcademicTerm = (): { semester: `FALL` | `SPRING` | `SUMMER`, year: number } => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  let semester: `FALL` | `SPRING` | `SUMMER`;
  if (month >= 0 && month <= 3) {
    semester = `SPRING`;
  } else if (month >= 4 && month <= 7) {
    semester = `SUMMER`;
  } else {
    semester = `FALL`;
  }
  return { semester, year };
};

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [ user, setUser ] = useState<UserProfile | null>(null);
  const [ isLoading, setIsLoading ] = useState(true);
  const [ error, setError ] = useState<string | null>(null);
  const [ showEditModal, setShowEditModal ] = useState(false);

  const [ newName, setNewName ] = useState(``);
  const [ newEmail, setNewEmail ] = useState(``);
  const [ newPassword, setNewPassword ] = useState(``);

  const [ selfEvalStatus, setSelfEvalStatus ] = useState<StudentSelfEvalStatus | null>(null);
  const [ selfEvalStatusLoading, setSelfEvalStatusLoading ] = useState(false);
  const [ selfEvalStatusError, setSelfEvalStatusError ] = useState<string | null>(null);

  const [ gitContributions, setGitContributions ] = useState<GitContribution[] | null>(null);
  const [ gitContributionsLoading, setGitContributionsLoading ] = useState(false);
  const [ gitContributionsError, setGitContributionsError ] = useState<string | null>(null);

  const [ _supervisorEvalCount, setSupervisorEvalCount ] = useState<{ pending: number, total: number } | null>(null);
  const [ _supervisorEvalCountLoading, setSupervisorEvalCountLoading ] = useState(false);
  const [ _supervisorEvalCountError, setSupervisorEvalCountError ] = useState<string | null>(null);

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
          if (response.status === 401 || response.status === 403) {
            await navigate(`/login`);
            throw new Error(`Session expired or invalid. Please log in again.`);
          }
          throw new Error(`Failed to fetch user profile (${response.status})`);
        }

        const jsonData = await response.json();

        if (jsonData && jsonData.user) {
          const fetchedUser = {
            id: jsonData.user.id || -1,
            createdAt: jsonData.user.createdAt,
            email: jsonData.user.email || `N/A`,
            name: jsonData.user.name || `N/A`,
            role: jsonData.user.role || `N/A`,
            supervisorId: jsonData.user.supervisorId || null,
            supervisorName: jsonData.user.supervisorName || `Not Assigned`,
            teamNames: jsonData.user.teamNames || `Not Assigned`,
          };
          setUser(fetchedUser);

          setNewName(fetchedUser.name === `N/A` ? `` : String(fetchedUser.name));
          setNewEmail(fetchedUser.email === `N/A` ? `` : String(fetchedUser.email));
        } else {
          throw new Error(`User data not found in response.`);
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

  useEffect(() => {
    if (user && user.role === `STUDENT` && user.id !== -1) {
      const { semester, year } = getCurrentAcademicTerm();

      const fetchSelfEval = async () => {
        setSelfEvalStatusLoading(true);
        setSelfEvalStatusError(null);
        try {
          const response = await fetch(`${fetchUrl}/evalStatus/self?semester=${semester}&year=${year}`, {
            credentials: `include`,
          });
          if (!response.ok) {
            throw new Error(`Failed to fetch self evaluation status.`);
          }
          const data = await response.json();
          if (
            typeof data === `object` &&
            data !== null &&
            typeof data.studentCompleted === `boolean`
          ) {
            setSelfEvalStatus(data as StudentSelfEvalStatus);
          } else {
            setSelfEvalStatusError(`Self evaluation status data is not in the expected format.`);
            setSelfEvalStatus(null);
          }
        } catch (err) {
          setSelfEvalStatusError(err instanceof Error ? err.message : `Unknown error fetching self eval status`);
        } finally {
          setSelfEvalStatusLoading(false);
        }
      };

      const fetchGitData = async () => {
        if (user.name === `N/A` || !user.name) {
          setGitContributions([]);
          setGitContributionsError(`Git username (user's name) is not available to fetch contributions.`);
          setGitContributionsLoading(false);
          return;
        }
        setGitContributionsLoading(true);
        setGitContributionsError(null);
        try {
          const response = await fetch(`${fetchUrl}/gitData`, {
            body: JSON.stringify({ username: user.name }),
            credentials: `include`,
            headers: { 'Content-Type': `application/json` },
            method: `POST`,
          });
          if (!response.ok) {
            throw new Error(`Failed to fetch Git contributions.`);
          }
          const data = await response.json();
          if (Array.isArray(data.data)) {
            setGitContributions(data.data as GitContribution[]);
          } else {
            setGitContributions([]);
            setGitContributionsError(`Git contribution data is not in the expected format.`);
          }
        } catch (err) {
          setGitContributionsError(err instanceof Error ? err.message : `Unknown error fetching Git contributions`);
        } finally {
          setGitContributionsLoading(false);
        }
      };

      void fetchSelfEval();
      void fetchGitData();
    }
  }, [ user ]);

  useEffect(() => {
    if (user && user.role === `SUPERVISOR`) {
      const { semester, year } = getCurrentAcademicTerm();

      const fetchSupervisorStats = async () => {
        setSupervisorEvalCountLoading(true);
        setSupervisorEvalCountError(null);
        try {
          const response = await fetch(`${fetchUrl}/supervisorEvals?semester=${semester}&year=${year}`, {
            credentials: `include`,
          });
          if (!response.ok) {
            throw new Error(`Failed to fetch supervisor evaluation stats.`);
          }
          const data = await response.json();

          let pending = 0;
          let total = 0;
          const typedData: Record<string, { studentCompleted: boolean, supervisorCompleted: boolean }> = data || {};
          if (typedData && Object.keys(typedData).length > 0) {
            total = Object.keys(typedData).length;
            pending = Object.values(typedData)
              .filter((status) => !status.supervisorCompleted)
              .length;
          }
          setSupervisorEvalCount({ pending, total });
        } catch (err) {
          setSupervisorEvalCountError(err instanceof Error ? err.message : `Unknown error fetching supervisor stats`);
        } finally {
          setSupervisorEvalCountLoading(false);
        }
      };
      void fetchSupervisorStats();
    }
  }, [ user ]);

  const handleSaveChanges = async () => {
    try {
      if (newPassword && newPassword.length < 6) {
        setError(`Password must be at least 6 characters long.`);
        return;
      }

      const payload: { email?: string, name?: string, password?: string, userId: number } = {
        userId: user!.id,
      };
      if (newName.trim() !== `` && newName !== user!.name) {
        payload.name = newName;
      }
      if (newEmail.trim() !== `` && newEmail !== user!.email) {
        payload.email = newEmail;
      }
      if (newPassword.trim() !== ``) {
        payload.password = newPassword;
      }

      if (Object.keys(payload).length <= 1) {
        setShowEditModal(false);
        return;
      }

      const response = await fetch(`${fetchUrl}/setUserInfo`, {
        body: JSON.stringify(payload),
        credentials: `include`,
        headers: { 'Content-Type': `application/json` },
        method: `POST`,
      });

      if (!response.ok) {
        const errorData: { error?: string } = await response.json().catch(() => ({
          error: `Failed to update profile.`,
        }));
        throw new Error(typeof errorData.error === `string` ? errorData.error : `Failed to update profile.`);
      }

      setShowEditModal(false);
      window.location.reload();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(`An unknown error occurred while updating your profile.`);
      }
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

  if (error && !user) {
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
    {error && <p className="error-message" style={{ marginBottom: `15px`, textAlign: `center` }}>{error}</p>}
    {` `}
    <main className="profile-content-grid">
      <div className="profile-card profile-details-card">
        <div className="profile-avatar">{user.name.charAt(0).toUpperCase()}</div>
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
        {user.role === `STUDENT` && <div className="profile-info-item">
          <span className="info-label">Supervisor</span>
          <span className="info-value">{user.supervisorName}</span>
        </div>}
        <div className="profile-info-item">
          <span className="info-label">Team</span>
          <span className="info-value">
            {user.teamNames && user.teamNames.length > 0 ? user.teamNames : `Not Assigned`}
          </span>
        </div>
        {(user.role === `SUPERVISOR`) &&
          <button
            className="button-edit-profile"
            onClick={() => {
              setNewName(user.name === `N/A` ? `` : user.name);
              setNewEmail(user.email === `N/A` ? `` : user.email);
              setNewPassword(``);
              setError(null);
              setShowEditModal(true);
            }}
            style={{ marginTop: `20px`, width: `100%` }}
          >
            Edit Profile
          </button>}
      </div>

      {user.role === `STUDENT` &&
        <>
          <div className="profile-card student-evaluations-card">
            <h3>My Evaluation Status</h3>
            {selfEvalStatusLoading && <p>Loading evaluation status...</p>}
            {selfEvalStatusError && <p className="error-message">{selfEvalStatusError}</p>}
            {selfEvalStatus && !selfEvalStatusLoading && !selfEvalStatusError ?
              <div className="profile-info-item">
                <span className="info-label wider">
                  Current Self-Evaluation
                  <br />
                  <span className="sub-title">(
                    {getCurrentAcademicTerm().semester} {getCurrentAcademicTerm().year}
                    )
                  </span>
                </span>
                <span
                  className={`info-value ${
                    selfEvalStatus.studentCompleted ? `status-completed` : `status-pending`
                  }`}
                >
                  {selfEvalStatus.studentCompleted ? `Completed` : `Pending`}
                </span>
              </div> :
              !selfEvalStatusLoading && !selfEvalStatusError && <p>Could not retrieve evaluation status.</p>}
          </div>

          <div className="profile-card student-git-card">
            <h3>Git Contributions</h3>
            {gitContributionsLoading && <p>Loading Git contributions...</p>}
            {gitContributionsError && <p className="error-message">{gitContributionsError}</p>}
            {gitContributions && !gitContributionsLoading && !gitContributionsError ?
              gitContributions.length > 0 ?
                <div className="profile-info-item">
                  <span className="info-label">Total Recorded Commits</span>
                  <span className="info-value">
                    {gitContributions.reduce((sum, contrib) => sum + (contrib.contribution_count || 0), 0)}
                  </span>
                </div> :
                <p>No Git contribution data found for '{user.name}'.</p> :
              !gitContributionsLoading && !gitContributionsError && <p>Git contribution data not available.</p>}
          </div>
        </>}
    </main>

    {showEditModal &&
      <div className="modal-overlay-profile">
        <div className="modal-content-profile">
          <h2>Edit Your Profile</h2>
          {error && <p className="error-message" style={{ textAlign: `center` }}>{error}</p>}
          {` `}
          <label>
            Username:
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={user.name !== `N/A` ? user.name : `Enter username`}
            />
          </label>
          <label>
            Email:
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder={user.email !== `N/A` ? user.email : `Enter email`}
            />
          </label>
          <label>
            Password:
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password (leave blank to keep current)"
            />
          </label>
          <div className="modal-buttons">
            <button className="button-default" onClick={handleSaveChanges}>Save Changes</button>
            <button
              className="button-default"
              onClick={() => {
                setShowEditModal(false);
                setError(null);
              }}
            >Cancel</button>
          </div>
        </div>
      </div>}
  </div>;
};

export default Profile;
