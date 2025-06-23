/* eslint-disable no-console */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PastEval, User } from './PastEvaluations';
import '../components/buttonandcard.css';
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
  const navigate = useNavigate();

  const selectStudent = (id: number | null) => {
    setSelectedStudentId(id === selectedStudentId ? null : id);
  };

  const navigateToPastEvaluations = () => {
    const data: Data = { role: `SUPERVISOR`, studentId: selectedStudentId };
    void navigate(`/past_evaluations`, { state: data });
  };

  useEffect(() => {
    const getUser = async () => {
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
        setUser({
          id: resJson.user.id,
          evalsGiven: resJson.user.evaluationsGiven,
          role: resJson.user.role,
          supervisorId: resJson.user.supervisorId || null,
          supervisorName: resJson.user.supervisorName,
        });
      } catch (err) {
        throw new Error(`user fetch error: ${err instanceof Error ? err.message : `unknown error`}`);
      }
    };

    void getUser();
  }, []);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await fetch(`http://localhost:3001/students/`, {
          credentials: `include`,
          headers: { 'Content-Type': `application/json` },
          method: `POST`,
        });

        if (!response.ok) {
          console.error(`Failed to fetch students`);
        }

        const jsonData = await response.json();

        if (jsonData && jsonData.students) {
          const allStudents = jsonData.students as Student[];
          const tempFilteredStudents = allStudents.filter(
            (student) =>
              user &&
              Array.isArray(user.evalsGiven) &&
              user.evalsGiven.some((evaluation: PastEval) => evaluation.studentId === student.id),
          );
          setStudents(tempFilteredStudents);
        }
      } catch (err) {
        throw new Error(`student fetch error: ${err instanceof Error ? err.message : `unknown error`}`);
      }
    };

    void fetchStudents();
  });

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
            {students.length > 0 ?
              students.map((student) =>
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
                  No students found.
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
        >
          View Evaluations
        </button>
      </div>
    </div>
  </div>;
};

export default StudentSelect;
