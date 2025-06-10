import React from 'react';

const Profile: React.FC = () => {
  const fetchUserInfo = () => `Fetch user info called`;
  fetchUserInfo();
  return <div>
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
      <div className="left-profile-info" />
    </div>
  </div>;
};
export default Profile;
