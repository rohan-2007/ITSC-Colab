import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const StudentSelect: React.FC = () => {
  const [ selectedStudentId, setSelectedStudentId ] = useState<number | null>(null);
  const [ students, setStudents ] = useState<Student[]>([]);
  const [ studentSearch, setStudentSearch ] = useState(``);
  const [ user, setUser ] = useState<User | null>(null);
  const navigate = useNavigate();

  interface Student {
    id: number;
    email: string;
    name: string;
    password: string;
  }

  interface Data {
    role: string;
    studentId: number | null;
  }

  interface PastEval {
    id: number;
    createdAt: string;
    criteria: JSON;
    semester: string;
    studentId: number;
    supervisorId: number | null;
    type: string;
    updatedAt: string;
    year: number;
  }

  interface User {
    id: number;
    role: `STUDENT` | `SUPERVISOR`;
    supervisorId: number | null;
    supervisorName: string;
  }

  const navigateToPastEvaluations = () => {
    const data: Data = { role: `supervisor`, studentId: selectedStudentId };
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

        // console.log(`user data: `, JSON.stringify(resJson, null, 2));

        const userId = resJson.user.id;

        setUser({
          id: resJson.user.id,
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

    const fetchStudents = async () => {
      try {
        const response = await fetch(`http://localhost:3001/students/`, {
          credentials: `include`,
          headers: { 'Content-Type': `application/json` },
          method: `POST`,
        });

        if (!response.ok) {
          // eslint-disable-next-line no-console
          console.error(`Failed to fetch students`);
        }

        const jsonData = await response.json();

        if (jsonData && jsonData.students) {
          const users = jsonData.students as Student[];
          setStudents(users);
          console.log(users);
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
  }, []);

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
            <th>Action</th>
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
              >
                <td>{student.id}</td>
                <td>{student.name}</td>
                <td>{student.email}</td>
                <td>
                  <button
                    type="button"
                    className="btn select-btn"
                    onClick={() => setSelectedStudentId(student.id)}
                    // disabled={isCompleted}
                  >
                    Select
                  </button>
                </td>
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
