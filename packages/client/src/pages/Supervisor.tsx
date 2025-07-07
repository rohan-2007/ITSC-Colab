/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { notifyAfterReload } from '../components/Notification';
import '../CSS/Supervisor.css';
import '../components/buttonAndCard.css';
import '../components/Modals.css';

const fetchUrl = `http://localhost:${3001}`;

interface NewUserData {
  email: string;
  name: string;
  password: string;
  role: `STUDENT` | `SUPERVISOR`;
  supervisorId?: number;
}

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (userData: NewUserData) => void;
  supervisors: Supervisor[];
}

const CreateUserModal: React.FC<CreateUserModalProps> = ({ isOpen, onClose, onCreate, supervisors }) => {
  const [ name, setName ] = useState(``);
  const [ email, setEmail ] = useState(``);
  const [ password, setPassword ] = useState(``);
  const [ role, setRole ] = useState<`STUDENT` | `SUPERVISOR`>(`STUDENT`);
  const [ supervisorId, setSupervisorId ] = useState(``);
  const [ error, setError ] = useState(``);

  useEffect(() => {
    if (isOpen) {
      setName(``);
      setEmail(``);
      setPassword(``);
      setRole(`STUDENT`);
      setError(``);
      if (supervisors && supervisors.length > 0) {
        setSupervisorId(supervisors[0].id.toString());
      } else {
        setSupervisorId(``);
      }
    }
  }, [ isOpen, supervisors ]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(``);

    if (!name || !email || !password || !role) {
      setError(`Please fill out all required fields.`);
      return;
    }
    if (role === `STUDENT` && !supervisorId) {
      setError(`A supervisor must be selected for a new student.`);
      return;
    }

    const userData: NewUserData = {
      email,
      name,
      password,
      role,
      ...role === `STUDENT` && { supervisorId: parseInt(supervisorId, 10) },
    };

    onCreate(userData);
  };

  return <div className="modal-overlay-supervisor" onClick={onClose}>
    <div className="modal-create-user" onClick={(e) => e.stopPropagation()}>
      <h4>Create New User</h4>
      <form onSubmit={handleSubmit} className="create-user-form">
        <div className="form-group-create">
          <label htmlFor="create-name">Full Name</label>
          <input
            id="create-name"
            type="text"
            placeholder="e.g., Jane Doe"
            value={name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
            required
          />
        </div>
        <div className="form-group-create">
          <label htmlFor="create-email">Email Address</label>
          <input
            id="create-email"
            type="email"
            placeholder="e.g., jane.doe@example.com"
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group-create">
          <label htmlFor="create-password">Initial Password</label>
          <input
            id="create-password"
            type="password"
            value={password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="form-group-create">
          <label htmlFor="create-role">Role</label>
          <select
            id="create-role"
            value={role}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setRole(e.target.value as `STUDENT` | `SUPERVISOR`)}
          >
            <option value="STUDENT">Student</option>
            <option value="SUPERVISOR">Supervisor</option>
          </select>
        </div>

        {role === `STUDENT` &&
          <div className="form-group-create">
            <label htmlFor="create-supervisor">Assign Supervisor</label>
            <select
              id="create-supervisor"
              value={supervisorId}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSupervisorId(e.target.value)}
              required={role === `STUDENT`}
            >
              {supervisors && supervisors.length > 0 ?
                supervisors.map((s) =>
                  <option key={s.id} value={s.id}>{s.name}</option>) :
                <option value="" disabled>No supervisors available</option>}
            </select>
          </div>}

        {error && <p className="error-message">{error}</p>}

        <div className="modal-buttons">
          <button type="button" onClick={onClose} className="modal-cancel-supervisor">
            Cancel
          </button>
          <button type="submit" className="modal-save-supervisor">
            Create User
          </button>
        </div>
      </form>
    </div>
  </div>;
};

interface Student {
  id: number;
  email: string;
  enabled: boolean;
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
  name: string;
  primarySupervisorId?: number;
  primarySupervisorName?: string;
}

const Supervisor: React.FC = () => {
  const [ students, setStudents ] = useState<Student[]>([]);
  const [ supervisors, setSupervisors ] = useState<Supervisor[]>([]);
  const [ supervisorSearchTerm, setSupervisorSearchTerm ] = useState(``);
  const [ teams, setTeams ] = useState<Team[]>([]);
  const [ currentUserId, setCurrentUserId ] = useState<number | null>(null);

  const [ studentSearchTerm, setStudentSearchTerm ] = useState(``);
  const [ studentSearch, setStudentSearch ] = useState(``);
  const [ teamSearch, setTeamSearch ] = useState(``);
  const [ studentInfoModalOpen, setStudentInfoModalOpen ] = useState(false);
  const [ teamEditModalOpen, setTeamEditModalOpen ] = useState(false);
  const [ teamMembersModalOpen, setMembersModalOpen ] = useState(false);
  const [ selectedTeamIndex, setSelectedTeamIndex ] = useState<number | null>(null);
  const [ viewingTeamIndex, setViewingTeamIndex ] = useState<number | null>(null);
  const [ editedStudent, setEditedStudent ] = useState<{
    email: string;
    enabled?: boolean;
    name: string;
    newPassword?: string;
    userId: number;
  } | null>(null);
  const [ editedTeamName, setEditedTeamName ] = useState(``);
  const [ editedPrimarySupervisorId, setEditedPrimarySupervisorId ] = useState<number | undefined>(undefined);
  const [ filteredStudents, setFilteredStudents ] = useState<Student[]>([]);

  const [ isCreateUserModalOpen, setCreateUserModalOpen ] = useState(false);

  const navigate = useNavigate();

  const handleCreateUser = async (userData: NewUserData) => {
    try {
      const response = await fetch(`${fetchUrl}/createUser`, {
        body: JSON.stringify(userData),
        credentials: `include`,
        headers: { 'Content-Type': `application/json` },
        method: `POST`,
      });

      if (!response.ok) {
        const errorData = await response.json() as { error?: string };
        throw new Error(errorData.error || `Failed to create user`);
      }

      setCreateUserModalOpen(false);
      notifyAfterReload(`User created successfully!`);
      window.location.reload();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const toggleEnableDisable = async (student: Student) => {
    setStudents((prev) => prev.map((s) => s.id === student.id ? { ...s, enabled: !s.enabled } : s));

    setEditedStudent({
      email: student.email,
      enabled: !student.enabled,
      name: student.name,
      newPassword: student.password,
      userId: student.id,
    });

    try {
      const res = await fetch(`${fetchUrl}/setUserInfo/`, {
        body: JSON.stringify({
          email: student.email,
          enabled: !student.enabled,
          name: student.name,
          password: student.password,
          userId: student.id,
        }),
        credentials: `include`,
        headers: { 'Content-Type': `application/json` },
        method: `POST`,
      });

      if (!res.ok) {
        setStudents((prev) => prev.map((s) => s.id === student.id ? { ...s, enabled: student.enabled } : s));
        return;
      }
      notifyAfterReload(`Student ${!student.enabled ? `enabled` : `disabled`} successfully.`);
      window.location.reload();
    } catch {
      setStudents((prev) => prev.map((s) => s.id === student.id ? { ...s, enabled: student.enabled } : s));
      throw new Error(`student enable/disable error occurred`);
    }
  };

  useEffect(() => {
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
          const userData: { id: number } = { id: jsonData.user.id };
          setCurrentUserId(userData.id);
          return userData;
        }
        return null;
      } catch {
        await navigate(`/login`);
        return null;
      }
    };

    const run = async () => {
      const userData = await checkSession();
      if (!userData) {
        return;
      }
      const fetchData = async () => {
        const studentsResponse = await fetch(`${fetchUrl}/students/?includeDisabled=true`, {
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
            primarySupervisorId?: number;
            primarySupervisorName: string;
          }
          const newTeams = (teamsData.teams as TeamFromApi[]).map((team) => {
            const assignedStudents = fetchedStudents
              .filter((s) => team.memberIDs.includes(s.id))
              .map((s) => s.name)
              .sort((a, b) => a.localeCompare(b));
            const assignedSupervisors = fetchedSupervisors
              .filter((s) => team.memberIDs.includes(s.id))
              .map((s) => s.name)
              .sort((a, b) => a.localeCompare(b));

            return {
              id: team.id,
              assignedStudents,
              assignedSupervisors,
              assignedUsers: [ ...assignedStudents, ...assignedSupervisors ],
              name: team.name,
              primarySupervisorId: team.primarySupervisorId,
              primarySupervisorName: team.primarySupervisorName,
            };
          });
          newTeams.sort((a, b) => a.name.localeCompare(b.name));
          setTeams(newTeams);
        }
      };

      await fetchData();
    };

    void run();
  }, [ navigate ]);

  useEffect(() => {
    if (currentUserId && students.length > 0 && supervisors.length > 0 && teams.length > 0) {
      const currentSupervisor = supervisors.find((s) => s.id === currentUserId);
      if (!currentSupervisor) {
        return;
      }
      const currentSupervisorName = currentSupervisor.name;

      const supervisorTeams = teams.filter((team) =>
        (team.assignedSupervisors || []).includes(currentSupervisorName));

      const visibleStudentNames = new Set<string>();
      supervisorTeams.forEach((team) => {
        team.assignedStudents.forEach((studentName) => {
          visibleStudentNames.add(studentName);
        });
      });

      const visibleStudents = students.filter((student) => {
        const isInSupervisorsTeam = visibleStudentNames.has(student.name);
        const isDisabled = !student.enabled;

        return isInSupervisorsTeam || isDisabled;
      });

      visibleStudents.sort((a, b) => {
        if (a.enabled && !b.enabled) {
          return -1;
        }
        if (!a.enabled && b.enabled) {
          return 1;
        }
        return a.name.localeCompare(b.name);
      });

      setFilteredStudents(visibleStudents);
    }
  }, [ teams, currentUserId, students, supervisors ]);

  const openStudentInfoModal = (student: Student) => {
    setEditedStudent({
      email: student.email,
      name: student.name,
      newPassword: ``,
      userId: student.id,
    });
    setStudentInfoModalOpen(true);
  };

  const openEditTeamModal = (index: number) => {
    setSelectedTeamIndex(index);
    setEditedTeamName(teams[index].name);
    setEditedPrimarySupervisorId(teams[index].primarySupervisorId);
    setTeamEditModalOpen(true);
  };

  const closeTeamModal = () => {
    setTeamEditModalOpen(false);
    setSelectedTeamIndex(null);
    setEditedTeamName(``);
    setEditedPrimarySupervisorId(undefined);
  };

  const closeStudentInfoModal = () => {
    setStudentInfoModalOpen(false);
  };

  const openTeamMembersModal = (index: number) => {
    setViewingTeamIndex(index);
    setMembersModalOpen(true);
  };

  const closeTeamMembersModal = () => {
    setMembersModalOpen(false);
    setViewingTeamIndex(null);
  };

  const saveStudentInfo = async () => {
    await fetch(`${fetchUrl}/setUserInfo/`, {
      body: JSON.stringify(editedStudent),
      credentials: `include`,
      headers: { 'Content-Type': `application/json` },
      method: `POST`,
    });

    closeStudentInfoModal();
    notifyAfterReload(`User info successfully updated`);
    window.location.reload();
  };

  const saveTeamName = async () => {
    if (selectedTeamIndex === null || editedTeamName.trim() === ``) {
      return;
    }

    const team = teams[selectedTeamIndex];
    const memberIDs = students
      .filter((s) => team.assignedStudents.includes(s.name))
      .map((s) => s.id);

    const updatedTeam = { ...team, name: editedTeamName.trim(), primarySupervisorId: editedPrimarySupervisorId };

    const updatedMemberIDs = memberIDs.concat(supervisors.filter((s) =>
      (updatedTeam.assignedSupervisors || []).includes(s.name)).map((s) => s.id));

    if (team.id) {
      await fetch(`${fetchUrl}/setTeamInfo`, {
        body: JSON.stringify({
          id: team.id,
          memberIDs: updatedMemberIDs,
          name: updatedTeam.name,
          primarySupervisorId: editedPrimarySupervisorId,
        }),
        credentials: `include`,
        headers: { 'Content-Type': `application/json` },
        method: `POST`,
      });
    } else {
      const res = await fetch(`${fetchUrl}/createTeam`, {
        body: JSON.stringify({
          memberIDs: updatedMemberIDs,
          name: updatedTeam.name,
          primarySupervisorId: editedPrimarySupervisorId,
        }),
        credentials: `include`,
        headers: { 'Content-Type': `application/json` },
        method: `POST`,
      });
      const json = await res.json();
      if (res.ok) {
        updatedTeam.id = json.team.id;
      }
    }

    const primarySupervisor = supervisors.find((s) => s.id === editedPrimarySupervisorId);
    updatedTeam.primarySupervisorName = primarySupervisor?.name || `None`;

    setTeams((prev) =>
      prev.map((t, i) => i === selectedTeamIndex ? updatedTeam : t));
    closeTeamModal();
    notifyAfterReload(`Team info successfully updated`);
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
    notifyAfterReload(`Team successfully deleted`);
    window.location.reload();
  };

  const handleStudentToggle = (teamIndex: number, studentName: string) => {
    setTeams((prev) =>
      prev.map((team, i) => {
        if (i === teamIndex) {
          const isAssigned = team.assignedStudents.includes(studentName);
          const newAssignedStudents = isAssigned ?
            team.assignedStudents.filter((name) => name !== studentName) :
            [ ...team.assignedStudents, studentName ];
          return {
            ...team,
            assignedStudents: newAssignedStudents,
            assignedUsers: [ ...newAssignedStudents, ...team.assignedSupervisors ],
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
          const newAssignedSupervisors = isAssigned ?
            assigned.filter((n) => n !== supervisorName) :
            [ ...assigned, supervisorName ];
          return {
            ...team,
            assignedSupervisors: newAssignedSupervisors,
            assignedUsers: [ ...team.assignedStudents, ...newAssignedSupervisors ],
          };
        }
        return team;
      }));
  };

  const addNewTeam = () => {
    const nextTeamNumber = teams.length + 1;
    const newTeam: Team = {
      assignedStudents: [],
      assignedSupervisors: [],
      assignedUsers: [],
      name: `New Team ${nextTeamNumber}`,
      primarySupervisorId: undefined,
      primarySupervisorName: `None`,
    };
    setTeams((prev) => {
      const updatedTeams = [ ...prev, newTeam ];
      updatedTeams.sort((a, b) => a.name.localeCompare(b.name));
      return updatedTeams;
    });
  };

  const filteredTeams = teams
    .filter((team) =>
      team.name.toLowerCase().includes(teamSearch.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  return <div className="supervisor-page">
    <header className="evaluations-header">
      <h1>Supervisor Console</h1>
      <p>Manage team members, student assignments and passwords, as well as other info.</p>
    </header>
    <div className="main-content-2">
      <div className="manage-student-card">
        <div className="manage-teams-card-header">
          <h2>Manage Student Information</h2>
          <button onClick={() => setCreateUserModalOpen(true)} className="button-new-team">
            + Create User
          </button>
        </div>
        <input
          type="text"
          placeholder="Search students..."
          value={studentSearch}
          onChange={(e) => setStudentSearch(e.target.value)}
          className="search-input"
        />
        <div className="scroll-box student-list">
          {filteredStudents
            .filter((s) =>
              studentSearch ? s.name.toLowerCase().includes(studentSearch.toLowerCase()) : true)
            .map((student) =>
              <div className="student-row" key={student.id}>
                {` `}
                <span className={`student-name ${!student.enabled ? `disabled-student-text` : ``}`}>
                  {student.name} {!student.enabled && `(Disabled)`}
                </span>
                <div className="supervisor-btn-div">
                  <button
                    onClick={() => openStudentInfoModal(student)}
                    className="button-change-info supervisor-btn"
                  >
                    Change Info
                  </button>
                  {!student.enabled &&
                    <button
                      onClick={() => toggleEnableDisable(student)}
                      className="button-change-info supervisor-btn-enable"
                    >
                      Enable
                    </button>}
                  {student.enabled &&
                    <button
                      onClick={() => toggleEnableDisable(student)}
                      className="button-change-info supervisor-btn-disable"
                    >
                      Disable
                    </button>}
                </div>
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
                <div className="team-info">
                  <span className="team-name-span">{team.name}</span>
                  <span className="team-lead-supervisor"> Lead: {team.primarySupervisorName}</span>
                </div>
                <div className="team-tools">
                  <button className="button-edit-team" onClick={() => openEditTeamModal(index)}>✎</button>
                  <button className="button-display-students" onClick={() => openTeamMembersModal(index)}>
                    ⓘ
                  </button>
                </div>
              </div>
            </div>)}
        </div>
      </div>
    </div>

    {studentInfoModalOpen &&
      <div
        className="modal-overlay-supervisor"
        onClick={closeStudentInfoModal}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === `Enter` || e.key === ` ` || e.key === `Escape`) {
            closeStudentInfoModal();
          }
        }}
      >
        <div
          className={`modal-student-info-modal ${studentInfoModalOpen ? `active` : ``}`}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
        >
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

    {teamMembersModalOpen && viewingTeamIndex !== null && (() => {
      const team = teams[viewingTeamIndex];
      if (!team) {
        return null;
      }

      const studentMembers = team.assignedStudents;
      const supervisorMembers = team.assignedSupervisors;

      return <div
        className="modal-overlay-supervisor"
        onClick={closeTeamMembersModal}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === `Enter` || e.key === ` ` || e.key === `Escape`) {
            closeTeamMembersModal();
          }
        }}
      >
        <div
          className={`modal-team-view ${teamMembersModalOpen ? `active` : ``}`}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          onKeyDown={(e) => {
            if (e.key === `Escape` || e.key === `Enter` || e.key === ` `) {
              e.stopPropagation();
            }
          }}
        >
          <div className="modal-team-view-header">
            <h4>Team Details</h4>
            <h2>{team.name}</h2>
            <div className="lead-supervisor-info">
              <strong>Primary Supervisor: {team.primarySupervisorName}</strong>
            </div>
          </div>

          <div className="modal-team-view-stats">
            <div className="stat-item">
              <span className="stat-number">{studentMembers.length + supervisorMembers.length}</span>
              <span className="stat-label">Total Members</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{supervisorMembers.length}</span>
              <span className="stat-label">Supervisors</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{studentMembers.length}</span>
              <span className="stat-label">Students</span>
            </div>
          </div>

          <div className="modal-team-view-content">
            <div className="modal-team-view-column">
              <h3>Supervisors</h3>
              <div className="member-list">
                {supervisorMembers.length > 0 ?
                  supervisorMembers.map((name, i) => <div key={`sup-${i}`} className="member-item">{name}</div>) :
                  <div className="member-item-empty">No supervisors assigned.</div>}
              </div>
            </div>
            <div className="modal-team-view-column">
              <h3>Students</h3>
              <div className="member-list">
                {studentMembers.length > 0 ?
                  studentMembers.map((name, i) => <div key={`stu-${i}`} className="member-item">{name}</div>) :
                  <div className="member-item-empty">No students assigned.</div>}
              </div>
            </div>
          </div>
          <div className="modal-buttons">
            <button onClick={closeTeamMembersModal} className="modal-cancel-supervisor">Close</button>
          </div>
        </div>
      </div>;
    })()}

    {teamEditModalOpen && selectedTeamIndex !== null &&
      <div className="modal-overlay-supervisor" onClick={closeTeamModal}>
        <div
          className={`modal-change-team-supervisor ${teamEditModalOpen ? `active` : ``}`}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            if (e.key === `Escape` || e.key === `Enter` || e.key === ` `) {
              e.stopPropagation();
            }
          }}
          role="dialog"
          aria-modal="true"
        >
          <h4>Edit Team</h4>
          <input
            id="teamName"
            type="text"
            value={editedTeamName}
            onChange={(e) => setEditedTeamName(e.target.value)}
            placeholder="Enter Team Name"
            className="modal-input-supervisor-team-name"
          />
          <h3>Primary Supervisor</h3>
          <select
            value={editedPrimarySupervisorId || ``}
            onChange={(e) => setEditedPrimarySupervisorId(e.target.value ? parseInt(e.target.value) : undefined)}
            className="modal-input-supervisor"
          >
            <option value="">Select Primary Supervisor</option>
            {supervisors.map((supervisor) =>
              <option key={supervisor.id} value={supervisor.id}>
                {supervisor.name}
              </option>)}
          </select>

          <div className="modal-form-group-supervisor">
            <h3>Assign Students</h3>
            <input
              type="text"
              placeholder="Search students..."
              value={studentSearchTerm}
              onChange={(e) => setStudentSearchTerm(e.target.value)}
              className="modal-input-supervisor"
            />
            <div className="dropdown-scroll">
              {students
                .filter((student) =>
                  student.name.toLowerCase().includes(studentSearchTerm.toLowerCase()))
                .sort((a, b) => {
                  if (a.enabled && !b.enabled) {
                    return -1;
                  }
                  if (!a.enabled && b.enabled) {
                    return 1;
                  }
                  return a.name.localeCompare(b.name);
                })
                .map((student) => {
                  const isCheckedStudent = teams[selectedTeamIndex].assignedStudents.includes(student.name);
                  return <label key={student.id} className="dropdown-item">
                    <input
                      type="checkbox"
                      checked={isCheckedStudent}
                      onChange={() => handleStudentToggle(selectedTeamIndex, student.name)}
                      disabled={!student.enabled}
                    />
                    {student.name}
                    {` `}
                    {!student.enabled && `(Disabled)`}
                  </label>;
                })}
            </div>
          </div>
          <div className="modal-form-group-supervisor">
            <h3>Assign Supervisors</h3>
            <input
              type="text"
              placeholder="Search supervisors..."
              value={supervisorSearchTerm}
              onChange={(e) => setSupervisorSearchTerm(e.target.value)}
              className="modal-input-supervisor"
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
            <button onClick={deleteTeam} className="modal-delete-supervisor">Delete</button>
            <button onClick={closeTeamModal} className="modal-cancel-supervisor">Cancel</button>
            <button onClick={saveTeamName} className="modal-save-supervisor">Save Changes</button>
          </div>
        </div>
      </div>}

    <CreateUserModal
      isOpen={isCreateUserModalOpen}
      onClose={() => setCreateUserModalOpen(false)}
      onCreate={handleCreateUser}
      supervisors={supervisors}
    />

  </div>;
};

export default Supervisor;
