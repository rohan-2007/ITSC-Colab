/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import React, { useState } from 'react';
import './Supervisor.css';

interface Student {
  name: string;
  password: string;
}

interface Team {
  assignedStudents: string[];
  expanded: boolean;
  name: string;
  search: string;
  showAssigned: boolean;
}

const Supervisor: React.FC = () => {
  const [ students, setStudents ] = useState<Student[]>(
    Array.from({ length: 10 }, (_, i) => ({
      name: `Student ${i + 1}`,
      password: `pass${i + 1}`,
    })),
  );

  const [ teams, setTeams ] = useState<Team[]>(
    Array.from({ length: 1 }, (_, i) => ({
      assignedStudents: [],
      expanded: false,
      name: `Team ${i + 1}`,
      search: ``,
      showAssigned: false,
    })),
  );

  const [ studentSearch, setStudentSearch ] = useState(``);
  const [ teamSearch, setTeamSearch ] = useState(``);
  const [ modalOpen, setModalOpen ] = useState(false);
  const [ teamEditModalOpen, setTeamEditModalOpen ] = useState(false);
  const [ selectedStudentIndex, setSelectedStudentIndex ] = useState<number | null>(null);
  const [ selectedTeamIndex, setSelectedTeamIndex ] = useState<number | null>(null);
  const [ newPassword, setNewPassword ] = useState(``);
  const [ editedTeamName, setEditedTeamName ] = useState(``);
  const [ showPasswordMap, setShowPasswordMap ] = useState<Record<number, boolean>>({});

  const openPasswordModal = (index: number) => {
    setSelectedStudentIndex(index);
    setNewPassword(students[index].password);
    setModalOpen(true);
  };

  const openEditTeamModal = (index: number) => {
    setSelectedTeamIndex(index);
    setEditedTeamName(teams[index].name);
    setTeamEditModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedStudentIndex(null);
    setNewPassword(``);
  };

  const closeTeamModal = () => {
    setTeamEditModalOpen(false);
    setSelectedTeamIndex(null);
    setEditedTeamName(``);
  };

  const savePassword = () => {
    if (selectedStudentIndex !== null && newPassword.trim() !== ``) {
      setStudents((prev) =>
        prev.map((s, i) =>
          i === selectedStudentIndex ? { ...s, password: newPassword.trim() } : s));
    }
    closeModal();
  };

  const saveTeamName = () => {
    if (selectedTeamIndex !== null && editedTeamName.trim() !== ``) {
      setTeams((prev) =>
        prev.map((team, i) =>
          i === selectedTeamIndex ? { ...team, name: editedTeamName.trim() } : team));
    }
    closeTeamModal();
  };

  const deleteTeam = () => {
    if (selectedTeamIndex !== null) {
      setTeams((prev) => prev.filter((_, i) => i !== selectedTeamIndex));
      closeTeamModal();
    }
  };

  const togglePasswordVisibility = (index: number) => {
    setShowPasswordMap((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const toggleTeamDropdown = (index: number) => {
    setTeams((prev) =>
      prev.map((team, i) =>
        i === index ? { ...team, expanded: !team.expanded } : { ...team, expanded: false }));
  };

  const toggleAssignedDropdown = (index: number) => {
    setTeams((prev) =>
      prev.map((team, i) =>
        i === index ? { ...team, showAssigned: !team.showAssigned } : team));
  };

  const handleStudentToggle = (teamIndex: number, studentName: string) => {
    setTeams((prev) =>
      prev.map((team, i) => {
        if (i === teamIndex) {
          const isAssigned = team.assignedStudents.includes(studentName);
          return {
            ...team,
            assignedStudents: isAssigned ?
              team.assignedStudents.filter((name) => name !== studentName) :
              [ ...team.assignedStudents, studentName ],
          };
        }
        return team;
      }));
  };

  const updateTeamSearch = (teamIndex: number, value: string) => {
    setTeams((prev) =>
      prev.map((team, i) =>
        i === teamIndex ? { ...team, search: value } : team));
  };

  const addNewTeam = () => {
    const nextTeamNumber = teams.length + 1;
    const newTeam: Team = {
      assignedStudents: [],
      expanded: false,
      name: `Team ${nextTeamNumber}`,
      search: ``,
      showAssigned: false,
    };
    setTeams((prev) => [ ...prev, newTeam ]);
  };

  const filteredStudents = students.filter((student) =>
    student.name.toLowerCase().includes(studentSearch.toLowerCase()));

  const filteredTeams = teams.filter((team) =>
    team.name.toLowerCase().includes(teamSearch.toLowerCase()));

  return <div className="supervisor-page">
    <header className="evaluations-header">
      <h1>Supervisor Console</h1>
      <p>Manage team members, student assignments and passwords, as well as other info.</p>
    </header>
    <div className="main-content">
      <div className="card">
        <h2>Manage Student Information</h2>
        <input
          type="text"
          placeholder="Search students..."
          value={studentSearch}
          onChange={(e) => setStudentSearch(e.target.value)}
          className="search-input"
        />
        <div className="scroll-box student-list">
          {filteredStudents.map((student, index) =>
            <div className="student-row" key={index}>
              <button className="item-button">{student.name}</button>
              <div className="password-tools">
                <div className="password-wrapper">
                  <input
                    type={showPasswordMap[index] ? `text` : `password`}
                    value={student.password}
                    readOnly
                    className="password-input"
                  />
                  <span
                    className="password-toggle"
                    onClick={() => togglePasswordVisibility(index)}
                    role="button"
                    tabIndex={0}
                  >
                    <img
                      src={showPasswordMap[index] ? `/eye.png` : `/eye-slash.png`}
                      alt={showPasswordMap[index] ? `Hide password` : `Show password`}
                    />
                  </span>
                </div>
                <button
                  onClick={() => openPasswordModal(index)}
                  className="change-password-button"
                >Change</button>
              </div>
            </div>)}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>Manage Student Teams</h2>
          <button onClick={addNewTeam} className="add-team-button">+ New Team</button>
        </div>
        <input
          type="text"
          placeholder="Search teams..."
          value={teamSearch}
          onChange={(e) => setTeamSearch(e.target.value)}
          className="search-input"
        />
        <div className="scroll-box team-list">
          {filteredTeams.map((team, index) =>
            <div key={index} className="team-section">
              <div className="student-row">
                <button className="item-button" onClick={() => toggleTeamDropdown(index)}>
                  {team.name}
                </button>
                <div className="team-tools">
                  <button className="edit-team-button" onClick={() => openEditTeamModal(index)}>✎</button>
                  <button className="toggle-button" onClick={() => toggleAssignedDropdown(index)}>
                    {team.assignedStudents.length}
                  </button>
                </div>
              </div>
              {team.showAssigned &&
                <div className="assigned-dropdown">
                  {team.assignedStudents.length ?
                    team.assignedStudents.map((name, i) =>
                      <div key={i} className="assigned-student">{name}</div>) :
                    <div className="assigned-student none">No students assigned</div>}
                </div>}
              {team.expanded &&
                <div className="dropdown">
                  <input
                    type="text"
                    placeholder="Search students..."
                    value={team.search}
                    onChange={(e) => updateTeamSearch(index, e.target.value)}
                    className="dropdown-search"
                  />
                  <div className="dropdown-scroll">
                    {students
                      .filter((s) => s.name.toLowerCase().includes(team.search.toLowerCase()))
                      .map((student, sIndex) =>
                        <label key={sIndex} className="dropdown-item">
                          <input
                            type="checkbox"
                            checked={team.assignedStudents.includes(student.name)}
                            onChange={() => handleStudentToggle(index, student.name)}
                          />
                          {student.name}
                        </label>)}
                  </div>
                </div>}
            </div>)}
        </div>
      </div>
    </div>

    {modalOpen &&
      <div className="modal-overlay" onClick={closeModal}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <h3>Change Password</h3>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="modal-input"
          />
          <div className="modal-buttons">
            <button onClick={savePassword} className="modal-save">Save</button>
            <button onClick={closeModal} className="modal-cancel">Cancel</button>
          </div>
        </div>
      </div>}

    {teamEditModalOpen &&
      <div className="modal-overlay" onClick={closeTeamModal}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <h3>Edit Team Name</h3>
          <input
            type="text"
            value={editedTeamName}
            onChange={(e) => setEditedTeamName(e.target.value)}
            className="modal-input"
          />
          <div className="modal-buttons">
            <button onClick={saveTeamName} className="modal-save">Save</button>
            <button onClick={closeTeamModal} className="modal-cancel">Cancel</button>
            <button onClick={deleteTeam} className="modal-delete">Delete</button>
          </div>
        </div>
      </div>}
  </div>;
};

export default Supervisor;
