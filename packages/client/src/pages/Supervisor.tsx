/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Supervisor.css';
const fetchUrl = `http://localhost:${3001}`;
interface Student {
  id: number;
  email: string;
  name: string;
  password: string;
}

interface Team {
  id?: number;
  assignedStudents: string[];
  expanded: boolean;
  name: string;
  search: string;
  showAssigned: boolean;
}

const Supervisor: React.FC = () => {
  const [ students, setStudents ] = useState<Student[]>([]);

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
  const [ studentInfoModalOpen, setStudentInfoModalOpen ] = useState(false);
  const [ teamEditModalOpen, setTeamEditModalOpen ] = useState(false);
  const [ _selectedStudentIndex, setSelectedStudentIndex ] = useState<number | null>(null);
  const [ selectedTeamIndex, setSelectedTeamIndex ] = useState<number | null>(null);
  const [ editedStudent, setEditedStudent ] = useState<{
    email: string;
    name: string;
    newPassword?: string;
    userId: number;
  } | null>(null);
  const [ editedTeamName, setEditedTeamName ] = useState(``);

  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch(`${fetchUrl}/me/`, {
          credentials: `include`,
          headers: { 'Content-Type': `application/json` },
          method: `POST`,
        });

        if (!response.ok) {
          await navigate(`/login`);
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(`[Evaluations useEffect] Session check failed:`, err);
        await navigate(`/login`);
      }
    };

    const fetchData = async () => {
      // First fetch students
      const studentsResponse = await fetch(`${fetchUrl}/students/`, {
        credentials: `include`,
        headers: { 'Content-Type': `application/json` },
        method: `POST`,
      });

      if (!studentsResponse.ok) {
        // eslint-disable-next-line no-console
        console.error(`Failed to fetch students`);
        return;
      }

      const studentsData = await studentsResponse.json();
      let fetchedStudents: Student[] = [];

      if (studentsData && studentsData.students) {
        fetchedStudents = studentsData.students as Student[];
        setStudents(fetchedStudents);
      }

      // Then fetch teams (now that we have students)
      const teamsResponse = await fetch(`${fetchUrl}/teams`, {
        credentials: `include`,
        headers: { 'Content-Type': `application/json` },
        method: `POST`,
      });

      const teamsData = await teamsResponse.json();

      if (teamsResponse.ok && teamsData.teams) {
        interface TeamFromApi {
          id: number;
          memberIDs: number[];
          name: string;
        }
        const newTeams = (teamsData.teams as TeamFromApi[]).map((team) => ({
          id: team.id,
          assignedStudents: fetchedStudents
            .filter((s) => team.memberIDs.includes(s.id))
            .map((s) => s.name),
          expanded: false,
          name: team.name,
          search: ``,
          showAssigned: false,
        }));

        setTeams(newTeams);
      }
    };

    void checkSession();
    void fetchData();
  }, [ navigate ]);

  const openStudentInfoModal = (index: number) => {
    setSelectedStudentIndex(index);
    setEditedStudent({
      email: students[index].email,
      name: students[index].name,
      newPassword: ``,
      userId: students[index].id,
    });
    setStudentInfoModalOpen(true);
  };

  const openEditTeamModal = (index: number) => {
    setSelectedTeamIndex(index);
    setEditedTeamName(teams[index].name);
    setTeamEditModalOpen(true);
  };

  const closeTeamModal = () => {
    setTeamEditModalOpen(false);
    setSelectedTeamIndex(null);
    setEditedTeamName(``);
  };

  const closeStudentInfoModal = () => {
    setStudentInfoModalOpen(false);
    setSelectedStudentIndex(null);
  };

  const saveStudentInfo = async () => {
    // eslint-disable-next-line no-console
    console.log(`Saving student info:`, editedStudent);

    const res = await fetch(`${fetchUrl}/setUserInfo/`, {
      body: JSON.stringify(editedStudent),
      credentials: `include`,
      headers: { 'Content-Type': `application/json` },
      method: `POST`,
    });
    if (!res.ok) {
      // eslint-disable-next-line no-console
      console.error(`Failed to set user info`);
    }

    const jsonData = await res.json();
    // eslint-disable-next-line no-console
    console.log(`Saved student info:`, jsonData);

    closeStudentInfoModal();
  };

  const saveTeamName = async () => {
    if (selectedTeamIndex === null || editedTeamName.trim() === ``) {
      return;
    }

    const team = teams[selectedTeamIndex];
    const updatedTeam = { ...team, name: editedTeamName.trim() };
    const memberIDs = students
      .filter((s) => updatedTeam.assignedStudents.includes(s.name))
      .map((s) => s.id);

    if (team.id) {
    // Update existing team
      await fetch(`${fetchUrl}/setTeamInfo`, {
        body: JSON.stringify({ id: team.id, memberIDs, name: updatedTeam.name }),
        credentials: `include`,
        headers: { 'Content-Type': `application/json` },
        method: `POST`,
      });
    } else {
    // Create new team
      const res = await fetch(`${fetchUrl}/createTeam`, {
        body: JSON.stringify({ memberIDs, name: updatedTeam.name }),
        credentials: `include`,
        headers: { 'Content-Type': `application/json` },
        method: `POST`,
      });
      const json = await res.json();
      if (res.ok) {
        updatedTeam.id = json.team.id;
      }
    }

    setTeams((prev) =>
      prev.map((t, i) => i === selectedTeamIndex ? updatedTeam : t));
    closeTeamModal();
  };

  const deleteTeam = async () => {
    if (selectedTeamIndex === null) {
      return;
    }

    const team = teams[selectedTeamIndex];

    if (team.id) {
      await fetch(`${fetchUrl}/deleteTeam/${team.id}`, {
        credentials: `include`,
        method: `DELETE`,
      });
    }

    setTeams((prev) => prev.filter((_, i) => i !== selectedTeamIndex));
    closeTeamModal();
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
    <div className="main-content-2">
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
            // Each student row now has the student name and a single "Change Info" button.
            <div className="student-row" key={index}>
              <span className="student-name">{student.name}</span>
              <button
                onClick={() => openStudentInfoModal(index)}
                className="change-info-button"
              >
                Change Info
              </button>
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
                <span className="team-name-span">{team.name}</span>
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

    {studentInfoModalOpen &&
      <div className="modal-overlay" onClick={closeStudentInfoModal}>
        <div className="modal student-info-modal" onClick={(e) => e.stopPropagation()}>
          <h3>Edit Student Information</h3>

          <div className="modal-form-group">
            <label htmlFor="studentName">Student Name</label>
            <input
              id="studentName"
              type="text"
              value={editedStudent?.name || ``}
              onChange={(e) => setEditedStudent((prev) => prev ? { ...prev, name: e.target.value } : null)}
              className="modal-input"
            />
          </div>

          <div className="modal-form-group">
            <label htmlFor="studentEmail">Email</label>
            <input
              id="studentEmail"
              type="email"
              value={editedStudent?.email || ``}
              onChange={(e) => setEditedStudent((prev) => prev ? { ...prev, email: e.target.value } : null)}
              className="modal-input"
            />
          </div>

          <div className="modal-form-group">
            <label htmlFor="studentPassword">New Password</label>
            <input
              id="studentPassword"
              type="password"
              placeholder="Leave blank to keep current"
              value={editedStudent?.newPassword || ``}
              onChange={(e) => setEditedStudent((prev) => prev ? { ...prev, newPassword: e.target.value } : null)}
              className="modal-input"
            />
          </div>

          <div className="modal-buttons">
            <button onClick={saveStudentInfo} className="modal-save">Save</button>
            <button onClick={closeStudentInfoModal} className="modal-cancel">Cancel</button>
          </div>
        </div>
      </div>}

    {teamEditModalOpen && selectedTeamIndex !== null &&
      <div className="modal-overlay" onClick={closeTeamModal}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <h3>Edit Team</h3>

          <label htmlFor="teamName">Team Name</label>
          <input
            id="teamName"
            type="text"
            value={editedTeamName}
            onChange={(e) => setEditedTeamName(e.target.value)}
            className="modal-input"
          />

          <div className="modal-form-group">
            <h3>Assign Students</h3>
            <div className="dropdown-scroll">
              {students.map((student) => {
                const isChecked = teams[selectedTeamIndex].assignedStudents.includes(student.name);
                return <label key={student.id} className="dropdown-item">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleStudentToggle(selectedTeamIndex, student.name)}
                  />
                  {student.name}
                </label>;
              })}
            </div>
          </div>

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
