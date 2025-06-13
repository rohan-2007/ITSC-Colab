import React, { useEffect, useState } from 'react';

const StudentSelect: React.FC = () => {
  const [ selectedStudentId, setSelectedStudentId ] = useState<number | null>(null);
  const [ students, setStudents ] = useState<Student[]>([]);
  const [ studentSearch, setStudentSearch ] = useState(``);
  const [ user, setUser ] = useState<User | null>(null);

  interface Student {
    id: number;
    email: string;
    name: string;
    password: string;
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

  const getPastEvals = async () => {
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

      const evalResponse = await fetch(`http://localhost:3001/getEval/?userId=${userId}`, {
        credentials: `include`,
        method: `GET`,
      });

      if (!evalResponse.ok) {
        throw new Error(`HTTP error! status: ${evalResponse.status}`);
      }

      const pastEvalsJson: PastEval[] = await evalResponse.json();

      // eslint-disable-next-line no-console
      console.log(`past evals: `, JSON.stringify(pastEvalsJson, null, 2));

      return pastEvalsJson;
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
        {/* <tbody>
            {filteredStudents.length > 0 ?
              filteredStudents.map((student) => {
                const status = studentsEvalStatus[student.id];
                // Check if the supervisor has completed the eval. Default to false if status is not yet loaded.
                const isCompleted = status ? status.supervisorCompleted : false;
                return <tr
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
                      disabled={isCompleted}
                    >
                      {isCompleted ? `Completed` : `Select`}
                    </button>
                  </td>
                </tr>;
              }) :
              <tr>
                <td colSpan={4} className="no-students-message">
                  No students found.
                </td>
              </tr>}
          </tbody> */}
      </table>
    </div>
  </div>;
};
export default StudentSelect;
