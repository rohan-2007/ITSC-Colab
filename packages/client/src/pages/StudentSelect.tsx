/* eslint-disable no-console */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PastEval, User } from './PastEvaluations';
// import Supervisor from './Supervisor';

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
    if (id === selectedStudentId) {
      setSelectedStudentId(null);
    } else {
      setSelectedStudentId(id);
    }
  };

  const navigateToPastEvaluations = () => {
    const data: Data = { role: `SUPERVISOR`, studentId: selectedStudentId };
    void navigate(`/past_evaluations`, { state: data });
  };

  useEffect(() => {
    const getUser = async () => {
      // console.log(`getPastEvals`);
      try {
        const res = await fetch(`http://localhost:3001/me/`, {
          body: JSON.stringify({ returnData: true }),
          credentials: `include`,
          headers: {
            'Content-Type': `application/json`,
          },
          method: `POST`,
        });

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const resJson = await res.json();

        console.log(`user data: `, JSON.stringify(resJson, null, 2));

        const userId = resJson.user.id;
        console.log(`supervisor userId`, resJson.user.id);

        setUser({
          id: resJson.user.id,
          evalsGiven: resJson.user.evaluationsGiven,
          role: resJson.user.role,
          supervisorId: resJson.user.supervisorId || null,
          supervisorName: resJson.user.supervisorName,
        });
      } catch (err) {
        if (err instanceof Error) {
          // console.log(`user fetch error: ${err.message}`);
          throw new Error(`user fetch error: ${err.message}`);
        } else {
          // console.log(`an unknown user fetch error`);
          throw new Error(`an unknown user fetch error`);
        }
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
          console.log(`inside`);
          console.log(`jsonData.students: `, jsonData.students);
          const allStudents = jsonData.students as Student[];
          console.log(`allStudents: `, allStudents);
          console.log(`user.id`, user.id);
          const tempFilteredStudents = allStudents.filter(
            (student) =>
              user &&
              Array.isArray(user.evalsGiven) &&
              user.evalsGiven.some((evaluation: PastEval) => evaluation.studentId === student.id),
          );
          setStudents(tempFilteredStudents);
        }
      } catch (err) {
        if (err instanceof Error) {
          // console.log(`user fetch error: ${err.message}`);
          throw new Error(`Error while fetching students: ${err.message}`);
        } else {
          // console.log(`an unknown user fetch error`);
          throw new Error(`an unknown students fetch error`);
        }
      }
    };

    void fetchStudents();
  });

  console.log(`students: `, students);

  return <div>
    <h1>Select student</h1>
    {/* <h2>Start Supervisor Evaluation</h2> */}
    <p>
      Choose which student you want to view an evaluation for:
    </p>

    {/* Search Input for the table */}
    <div className="form-group">
      <label htmlFor="student-search">Search Students:</label>
      <input
        id="student-search"
        type="text"
        placeholder="e.g., Alice Johnson"
        value={studentSearch}
        onChange={(e) => {
          setStudentSearch(e.target.value);
          setSelectedStudentId(null); // Deselect student when search changes
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
            {` `}
          </tr>
        </thead>
        <tbody>
          {students.length > 0 ?
            students.map((student) =>
              // const status = studentsEvalStatus[student.id];
              // Check if the supervisor has completed the eval. Default to false if status is not yet loaded.
              // const isCompleted = status ? status.supervisorCompleted : false;
              <tr
                key={student.id}
                className={selectedStudentId === student.id ? `selected` : ``}
                onClick={() => selectStudent(student.id)}
              >
                <td>{student.id}</td>
                <td>{student.name}</td>
                <td>{student.email}</td>
                {student.teams[0] ?
                  <td>{student.teams[0].name}</td> : <td>No team</td>}
              </tr>) :
            <tr>
              <td colSpan={4} className="no-students-message">
                No students found.
              </td>
            </tr>}
        </tbody>
      </table>
    </div>
    <div className="modal-footer">
      <button
        type="button"
        className="btn secondary-btn"
        style={{ backgroundColor: `#757575` }}
        data-modal-id="evaluation-modal"
        onClick={() => {
          navigateToPastEvaluations();
        }}
      >
        View Evaluations
      </button>
    </div>
  </div>;
};
export default StudentSelect;
