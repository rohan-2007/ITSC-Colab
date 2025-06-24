/* eslint-disable no-console */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Evaluation, User } from './PastEvaluations';
import '../components/ButtonAndCard.css';
import '../CSS/StudentSelect.css';

export interface Student {
  id: number;
  createdAt: string;
  email: string;
  name: string;
  password: string;
  role: string;
  supervisorId: number;
  teams: Team[];
  updatedAt: string;
}

interface Team {
  id: number;
  createdAt: string;
  name: string;
  updatedAt: string;
}

interface Data {
  role: string;
  studentId: number | null;
}

const StudentSelect: React.FC = () => {
  const [ selectedStudentId, setSelectedStudentId ] = useState<number | null>(null);
  const [ students, setStudents ] = useState<Student[]>([]);
  const [ studentSearch, setStudentSearch ] = useState(``);
  const [ user, setUser ] = useState<User | null>(null);
  const [ _userEvaluations, setUserEvaluations ] = useState<Evaluation[]>([]);
  const [ loading, setLoading ] = useState(true);
  const navigate = useNavigate();

  const selectStudent = (id: number | null) => {
    setSelectedStudentId(id === selectedStudentId ? null : id);
  };

  const navigateToPastEvaluations = () => {
    const data: Data = { role: `SUPERVISOR`, studentId: selectedStudentId };
    void navigate(`/past_evaluations`, { state: data });
  };

  const fetchUser = async () => {
    try {
      const res = await fetch(`http://localhost:3001/me/`, {
        body: JSON.stringify({ returnData: true }),
        credentials: `include`,
        headers: { 'Content-Type': `application/json` },
        method: `POST`,
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const resJson = await res.json();
      const userData: User = {
        id: resJson.user.id,
        email: resJson.user.email,
        role: resJson.user.role,
        supervisorId: resJson.user.supervisorId || null,
        supervisorName: resJson.user.supervisorName,
        teamNames: resJson.user.teamNames,
      };
      setUser(userData);

      // Fetch evaluations given by this supervisor
      if (userData.role === `SUPERVISOR`) {
        const evalRes = await fetch(`http://localhost:3001/getEval/?userId=${userData.id}`, {
          credentials: `include`,
          method: `GET`,
        });

        if (evalRes.ok) {
          const evaluationsData: Evaluation[] = await evalRes.json();
          // Filter for evaluations given by this supervisor
          const supervisorEvals = evaluationsData.filter((evaluation) => evaluation.supervisorId === userData.id);
          setUserEvaluations(supervisorEvals);
        }
      }
    } catch (err) {
      console.error(`User fetch error:`, err);
    }
  };

  const fetchStudents = async () => {
    if (!user) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/students/`, {
        credentials: `include`,
        headers: { 'Content-Type': `application/json` },
        method: `POST`,
      });

      if (!response.ok) {
        console.error(`Failed to fetch students`);
        return;
      }

      const jsonData = await response.json();

      if (jsonData?.students) {
        setStudents(jsonData.students as Student[]);
      }
      setLoading(false);
    } catch (err) {
      console.error(`Student fetch error:`, err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      await fetchUser();
    };
    void initializeData();
  }, []);

  useEffect(() => {
    void fetchStudents();
  });

  // Filter students based on search
  const filteredStudents = students.filter((student) =>
    student.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
    student.email.toLowerCase().includes(studentSearch.toLowerCase()));

  if (loading) {
    return <div>Loading...</div>;
  }

  return <div className="student-select-wrapper">
    <div className="student-select-card">
      <h1 className="page-title">Select Student</h1>
      <hr className="title-underline" />
      <p className="page-subtext">
        Choose which student you want to view an evaluation for:
      </p>

      <div className="form-group">
        <label htmlFor="student-search">Search Students:</label>
        <input
          id="student-search"
          type="text"
          placeholder="e.g., Alice Johnson"
          value={studentSearch}
          onChange={(e) => {
            setStudentSearch(e.target.value);
            setSelectedStudentId(null);
          }}
        />
      </div>

      <div className="student-table-container">
        <table className="student-select-table">
          <thead>
            <tr>
              <th>Student ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Team</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.length > 0 ?
              filteredStudents.map((student) =>
                <tr
                  key={student.id}
                  className={selectedStudentId === student.id ? `selected` : ``}
                  onClick={() => selectStudent(student.id)}
                >
                  <td>{student.id}</td>
                  <td>{student.name}</td>
                  <td>{student.email}</td>
                  <td>{student.teams[0] ? student.teams[0].name : `No team`}</td>
                </tr>) :
              <tr>
                <td colSpan={4} className="no-students-message">
                  {studentSearch ? `No students match your search.` : `No students found.`}
                </td>
              </tr>}
          </tbody>
        </table>
      </div>

      <div className="modal-footer center-button">
        <button
          type="button"
          className="view-eval-student"
          data-modal-id="evaluation-modal"
          onClick={() => navigateToPastEvaluations()}
          disabled={!selectedStudentId}
        >
          View Evaluations
        </button>
      </div>
    </div>
  </div>;
};

export default StudentSelect;
