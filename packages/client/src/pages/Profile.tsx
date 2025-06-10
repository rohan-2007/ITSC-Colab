import React from 'react';
import './Profile.css';

const Profile: React.FC = () => {
  const fetchUserInfo = async () => {
    try {
      const res = await fetch(`http://localhost:3001/me/`, {
        body: JSON.stringify({ returnData: true }),
        credentials: `include`,
        headers: {
          'Content-Type': `application/json`,
        },
        method: `POST`,
      });

      const resJson = await res.json();

      // eslint-disable-next-line no-console
      console.log(`resJson: `, JSON.stringify(resJson, null, 2));

      const userName = resJson.user.name || `N/A`;
      const userEmail = resJson.user.email || `N/A`;
      const userRole = resJson.user.role || `N/A`;
      const userSupervisor = resJson.user.supervisorName || `N/A`;
    } catch (err) {
      if (err instanceof Error) {
        throw new Error(`Failed to fetch user info: ${err.message}`);
      } else {
        throw new Error(`Failed to fetch user info: Unknown error`);
      }
    }
    // evaluationType: resJson.user.role,
    // semester: selectedSemester,
    // supervisorId: resJson.user.role === `SUPERVISOR` ? resJson.user.userId : resJson.user.supervisorId,
    // userId: resJson.user.id,
  };
  fetchUserInfo();
  return <div className="profile-container">
    <h1>Profile</h1>
    <div className="profile-div">
      <div className="left-profile-info">
        <h2>Your Profile</h2>
        <p>Name: Name</p>
        <p>Email: Name</p>
        <p>Role: Name</p>
      </div>
      <div className="right-profile-info">
        <p>Supervisor: Name</p>
        <button>Change Supervisor</button>
        <p>Team: Name</p>
        <button>Change Team</button>
      </div>
    </div>
  </div>;
};
export default Profile;
