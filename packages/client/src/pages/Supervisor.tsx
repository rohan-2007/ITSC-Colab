/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../CSS/Supervisor.css';
import '../components/buttonAndCard.css';
import '../components/Modals.css';
const fetchUrl = `http://localhost:${3001}`;
interface Student {
  id: number;
  email: string;
  name: string;
  password: string;
  supervisorId: number;
}

interface Supervisor {
  id: number;
  email: string;
  name: string;
}

interface Team {
  id?: number;
  assignedStudents: string[];
  assignedSupervisors: string[];
  assignedUsers: string[];
  expanded: boolean;
  name: string;
  search: string;
  showAssigned: boolean;
}

const Supervisor: React.FC = () => {
  const [ students, setStudents ] = useState<Student[]>([]);
  const [ supervisors, setSupervisors ] = useState<Supervisor[]>([]);
  const [ supervisorSearchTerm, setSupervisorSearchTerm ] = useState(``);
  const [ teams, setTeams ] = useState<Team[]>(
    Array.from({ length: 1 }, (_, i) => ({
      assignedStudents: [],
      assignedSupervisors: [],
      assignedUsers: [],
      expanded: false,
      name: `Team ${i + 1}`,
      search: ``,
      showAssigned: false,
    })),
  );

  const [ studentSearchTerm, setStudentSearchTerm ] = useState(``);
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
  const [ filteredStudents, setFilteredStudents ] = useState<Student[]>([]);

  const navigate = useNavigate();

  useEffect(() => {
    const run = async () => {
      const checkSession = async () => {
        try {
          const response = await fetch(`${fetchUrl}/me/`, {
            body: JSON.stringify({ returnData: true }),
            credentials: `include`,
            headers: { 'Content-Type': `application/json` },
            method: `POST`,
          });

          if (!response.ok) {
            await navigate(`/login`);
            return null;
          }

          const jsonData = await response.json();
          if (jsonData && jsonData.user) {
            const userData = { id: jsonData.user.id };
            return userData;
          }
          return null;
        } catch {
          await navigate(`/login`);
          return null;
        }
      };

      const userData = await checkSession();
      if (!userData) {
        return;
      }

      const fetchData = async () => {
        const studentsResponse = await fetch(`${fetchUrl}/students/`, {
          credentials: `include`,
          headers: { 'Content-Type': `application/json` },
          method: `POST`,
        });

        if (!studentsResponse.ok) {
          return;
        }

        const studentsData = await studentsResponse.json();
        let fetchedStudents: Student[] = [];

        if (studentsData && studentsData.students) {
          fetchedStudents = studentsData.students as Student[];
          setStudents(fetchedStudents);
        }

        setFilteredStudents(
          fetchedStudents.filter((student) => student.supervisorId === userData.id),
        );

        const supRes = await fetch(`${fetchUrl}/supervisors`, {
          credentials: `include`,
          headers: { 'Content-Type': `application/json` },
          method: `POST`,
        });

        const supData = await supRes.json();
        let fetchedSupervisors: Supervisor[] = [];

        if (supData && supData.supervisors) {
          fetchedSupervisors = supData.supervisors as Supervisor[];
          setSupervisors(fetchedSupervisors);
        }

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
            assignedSupervisors: fetchedSupervisors
              .filter((s) => team.memberIDs.includes(s.id))
              .map((s) => s.name),
            assignedUsers: [
              ...fetchedStudents.filter((s) => team.memberIDs.includes(s.id)).map((s) => s.name),
              ...fetchedSupervisors.filter((s) => team.memberIDs.includes(s.id)).map((s) => s.name),
            ],
            expanded: false,
            name: team.name,
            search: ``,
            showAssigned: false,
          }));

          setTeams(newTeams);
        }
      };

      await fetchData();
    };

    void run();
  }, [ navigate ]);

  const openStudentInfoModal = (index: number) => {
    setSelectedStudentIndex(index);
    setEditedStudent({
      email: filteredStudents[index].email,
      name: filteredStudents[index].name,
      newPassword: ``,
      userId: filteredStudents[index].id,
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
    await fetch(`${fetchUrl}/setUserInfo/`, {
      body: JSON.stringify(editedStudent),
      credentials: `include`,
      headers: { 'Content-Type': `application/json` },
      method: `POST`,
    });

    closeStudentInfoModal();
    window.location.reload();
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

    const updatedMemberIDs = memberIDs.concat(supervisors.filter((s) =>
      (updatedTeam.assignedSupervisors || []).includes(s.name)).map((s) => s.id));

    if (team.id) {
      await fetch(`${fetchUrl}/setTeamInfo`, {
        body: JSON.stringify({ id: team.id, memberIDs: updatedMemberIDs, name: updatedTeam.name }),
        credentials: `include`,
        headers: { 'Content-Type': `application/json` },
        method: `POST`,
      });
    } else {
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
    window.location.reload();
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
    window.location.reload();
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

  const handleSupervisorToggle = (teamIndex: number, supervisorName: string) => {
    setTeams((prev) =>
      prev.map((team, i) => {
        if (i === teamIndex) {
          const assigned = team.assignedSupervisors || [];
          const isAssigned = assigned.includes(supervisorName);
          return {
            ...team,
            assignedSupervisors: isAssigned ?
              assigned.filter((n) => n !== supervisorName) :
              [ ...assigned, supervisorName ],
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
      assignedSupervisors: [],
      assignedUsers: [],
      expanded: false,
      name: `Team ${nextTeamNumber}`,
      search: ``,
      showAssigned: false,
    };
    setTeams((prev) => [ ...prev, newTeam ]);
  };

  const filteredTeams = teams.filter((team) =>
    team.name.toLowerCase().includes(teamSearch.toLowerCase()));

  return <div className="supervisor-page">
    <header className="evaluations-header">
      <h1>Supervisor Console</h1>
      <p>Manage team members, student assignments and passwords, as well as other info.</p>
    </header>
    <div className="main-content-2">
      <div className="manage-student-card">
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
              <span className="student-name">{student.name}</span>
              <button
                onClick={() => openStudentInfoModal(index)}
                className="button-change-info"
              >
                Change Info
              </button>
            </div>)}
        </div>
      </div>

      <div className="manage-teams-card">
        <div className="manage-teams-card-header">
          <h2>Manage Student Teams</h2>
          <button onClick={addNewTeam} className="button-new-team">+ New Team</button>
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
                  <button className="button-edit-team" onClick={() => openEditTeamModal(index)}>✎</button>
                  <button className="button-display-students" onClick={() => toggleAssignedDropdown(index)}>
                    {team.assignedUsers.length}
                  </button>
                </div>
              </div>
              {team.showAssigned &&
                <div className="assigned-dropdown">
                  {team.assignedUsers.length ?
                    team.assignedUsers.map((name, i) =>
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
      <div className="modal-overlay-supervisor" onClick={closeStudentInfoModal}>
        <div className="modal-student-info-modal" onClick={(e) => e.stopPropagation()}>
          <h3>Edit Student Information</h3>

          <div className="modal-form-group-supervisor">
            <label htmlFor="studentName">Student Name</label>
            <input
              id="studentName"
              type="text"
              value={editedStudent?.name || ``}
              onChange={(e) => setEditedStudent((prev) => prev ? { ...prev, name: e.target.value } : null)}
              className="modal-input-supervisor"
            />
          </div>

          <div className="modal-form-group-supervisor">
            <label htmlFor="studentEmail">Email</label>
            <input
              id="studentEmail"
              type="email"
              value={editedStudent?.email || ``}
              onChange={(e) => setEditedStudent((prev) => prev ? { ...prev, email: e.target.value } : null)}
              className="modal-input-supervisor"
            />
          </div>

          <div className="modal-form-group-supervisor">
            <label htmlFor="studentPassword">New Password</label>
            <input
              id="studentPassword"
              type="password"
              placeholder="Leave blank to keep current"
              value={editedStudent?.newPassword || ``}
              onChange={(e) => setEditedStudent((prev) => prev ? { ...prev, newPassword: e.target.value } : null)}
              className="modal-input-supervisor"
            />
          </div>

          <div className="modal-buttons">
            <button onClick={saveStudentInfo} className="modal-save">Save</button>
            <button onClick={closeStudentInfoModal} className="modal-cancel-supervisor">Cancel</button>
          </div>
        </div>
      </div>}

    {teamEditModalOpen && selectedTeamIndex !== null &&
      <div className="modal-overlay-supervisor" onClick={closeTeamModal}>
        <div className="modal-change-team-supervisor" onClick={(e) => e.stopPropagation()}>
          <h4>Edit Team</h4>
          <h3>Team Name</h3>
          <input
            id="teamName"
            type="text"
            value={editedTeamName}
            onChange={(e) => setEditedTeamName(e.target.value)}
            className="modal-input-supervisor-team-name"
          />

          <div className="modal-form-group-supervisor">
            <h3>Assign Students</h3>
            <input
              type="text"
              placeholder="Search students..."
              value={studentSearchTerm}
              onChange={(e) => setStudentSearchTerm(e.target.value)}
              className="modal-input-supervisor"
              style={{ marginBottom: `10px` }}
            />

            <div className="dropdown-scroll">
              {students
                .filter((student) =>
                  student.name.toLowerCase().includes(studentSearchTerm.toLowerCase()))
                .map((student) => {
                  const isCheckedStudent = teams[selectedTeamIndex].assignedStudents.includes(student.name);
                  return <label key={student.id} className="dropdown-item">
                    <input
                      type="checkbox"
                      checked={isCheckedStudent}
                      onChange={() => handleStudentToggle(selectedTeamIndex, student.name)}
                    />
                    {student.name}
                  </label>;
                })}
            </div>
          </div>
          {/* ───────── Assign Supervisors (NEW) ───────── */}
          <div className="modal-form-group-supervisor">
            <h3>Assign Supervisors</h3>
            <input
              type="text"
              placeholder="Search supervisors..."
              value={supervisorSearchTerm}
              onChange={(e) => setSupervisorSearchTerm(e.target.value)}
              className="modal-input-supervisor"
              style={{ marginBottom: `10px` }}
            />

            <div className="dropdown-scroll">
              {supervisors
                .filter((s) =>
                  s.name.toLowerCase().includes(supervisorSearchTerm.toLowerCase()))
                .map((sup) => {
                  const isCheckedSupervisor = (teams[selectedTeamIndex].assignedSupervisors || []).includes(
                    sup.name,
                  );
                  return <label key={sup.id} className="dropdown-item">
                    <input
                      type="checkbox"
                      checked={isCheckedSupervisor}
                      onChange={() => handleSupervisorToggle(selectedTeamIndex, sup.name)}
                    />
                    {sup.name}
                  </label>;
                })}
            </div>
          </div>

          <div className="modal-buttons">
            <button onClick={saveTeamName} className="modal-save-supervisor">Save</button>
            <button onClick={closeTeamModal} className="modal-cancel-supervisor">Cancel</button>
            <button onClick={deleteTeam} className="modal-delete-supervisor">Delete</button>
          </div>
        </div>
      </div>}
  </div>;
};

export default Supervisor;
