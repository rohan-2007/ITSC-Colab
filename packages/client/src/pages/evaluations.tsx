import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from './PastEvaluations';
import { Criteria, CriteriaLevel, Level, SubCriteria } from './PastEvaluations';
import './evaluations.css';
import '../components/buttonandcard.css';

const fetchUrl = `http://localhost:3001`;

type PerformanceLevel = `starting` | `inProgress` | `competitive`;
type Selections = Record<string, PerformanceLevel>;

// interface User {
//   id: number;
//   role: `STUDENT` | `SUPERVISOR`;
//   supervisorId: number | null;
//   supervisorName: string;
// }

const assignSemester = (): `SPRING` | `SUMMER` | `FALL` | `UNKNOWN` => {
  const today = new Date();
  const year = today.getFullYear();
  if (today >= new Date(year, 4, 12) && today <= new Date(year, 7, 9)) {
    return `SUMMER`;
  }
  if (today >= new Date(year, 7, 25) && today <= new Date(year, 11, 5)) {
    return `FALL`;
  }
  if (today >= new Date(year, 0, 12) && today <= new Date(year, 3, 24)) {
    return `SPRING`;
  }
  return `UNKNOWN`;
};

interface Student {
  id: number;
  email: string;
  name: string;
  password: string;
  supervisorId: number;
}

const Evaluations: React.FC = () => {
  const navigate = useNavigate();
  const [ user, setUser ] = useState<User | null>(null);
  const [ isLoading, setIsLoading ] = useState(true);
  const [ isFormVisible, setIsFormVisible ] = useState(false);
  const [ isPreModalVisible, setIsPMVisible ] = useState(false);
  const [ studentSearch, setStudentSearch ] = useState(``);
  const [ selectedStudentId, setSelectedStudentId ] = useState<number | null>(null);
  const [ selectedSemester, setSelectedSemester ] = useState(assignSemester());
  const [ message, setMessage ] = useState(``);
  const [ students, setStudents ] = useState<Student[]>([]);
  const [ canStartSelfEval, setCanSelfEval ] = useState(true);
  const [ selectedTeam, setSelectedTeam ] = useState(user?.teamNames ? user.teamNames[0] : `no team`);
  const [ criteria, setCriteria ] = useState<Criteria[]>([]);

  // This state is our single source of truth for all statuses.
  const [ studentsEvalStatus, setStudentsEvalStatus ] = useState<Record<number, {
    studentCompleted: boolean;
    supervisorCompleted: boolean;
  }>>({});

  const filteredStudents = students.filter((student) =>
    student.name.toLowerCase().includes(studentSearch.toLowerCase()));

  const currentYear = new Date().getFullYear();

  const rubricData = criteria.map((item) => ({
    id: item.name,
    descriptions: item.criteriaLevels.map((level) => level.description),
    levels: item.criteriaLevels.map((level) => level.level.name),
    subCriteria: item.subCriteria.map((element) => element.name),
    title: item.title,
  }));

  const [ selections, setSelections ] = useState<Selections>(
    rubricData.reduce((acc, cr) => ({ ...acc, [cr.id]: `starting` }), {}),
  );

  const getCriteriaData = async () => {
    try {
      const res = await fetch(`http://localhost:3001/criteriaData/`, {
        headers: {
          'Content-Type': `application/json`,
        },
        method: `POST`,
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const resJson = await res.json();

      const criteriaData = resJson.criteria as Criteria[];
      console.log(`criteriaData: `, criteriaData);
      setCriteria(criteriaData);
    } catch (err) {
      if (err instanceof Error) {
        throw new Error(`user fetch error: ${err.message}`);
      } else {
        throw new Error(`an unknown user fetch error`);
      }
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(`${fetchUrl}/me/`, {
          body: JSON.stringify({ returnData: true }),
          credentials: `include`,
          headers: { 'Content-Type': `application/json` },
          method: `POST`,
        });
        if (!response.ok) {
          throw new Error(`Session not found. Please log in.`);
        }
        const data = await response.json();
        setUser({
          id: data.user.id,
          evalsGiven: data.user.evaluationsGiven,
          role: data.user.role,
          supervisorId: data.user.supervisorId || null,
          supervisorName: data.user.supervisorName,
          teamNames: data.user.teamNames,
        });
        const team = data.user.teamNames[0];
        setSelectedTeam(team);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(`Failed to fetch user data: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setIsLoading(false);
      }
    };
    void fetchUser();
    void getCriteriaData();
  }, [ navigate ]);

  const fetchEvalStatusForCurrentUser = async (studentId: number) => {
    try {
      const response = await fetch(
        `${fetchUrl}/evalStatus?studentId=${studentId}&semester=${assignSemester()}&year=${currentYear}`, {
          credentials: `include`,
        },
      );
      if (response.ok) {
        const data = await response.json();
        if (data) {
          // Update the status for just this one user in our map
          setStudentsEvalStatus((prev) => ({ ...prev, [studentId]: data }));
          setCanSelfEval(Boolean(!data.studentCompleted));
          // eslint-disable-next-line no-console
          console.log(canStartSelfEval);
        }
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(`Failed to fetch evaluation status:`, err);
    }
  };

  const handleSelect = (criterionId: string, level: PerformanceLevel) => {
    setSelections((prev) => ({ ...prev, [criterionId]: level }));
  };

  const fetchStudents = async () => {
    const response = await fetch(`${fetchUrl}/students/`, {
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
      const allStudents = jsonData.students as Student[];
      const tempFilteredStudents = allStudents.filter(
        (student) => student.supervisorId === user?.id,
      );

      setStudents(tempFilteredStudents);
    }
  };

  // Fetch all statuses for supervisor's students
  const fetchAllStatuses = async () => {
    setSelectedStudentId(null);
    await fetchStudents();
    if (user?.role !== `SUPERVISOR` || students.length === 0) {
      return;
    }
    // Create an array of fetch promises, one for each student
    const statusPromises = students.map((student) =>
      fetch(
        `${fetchUrl}/evalStatus?studentId=${student.id}&semester=${assignSemester()}&year=${currentYear}`,
        { credentials: `include` },
      )
        .then((res) => res.ok ? res.json() : { studentCompleted: false, supervisorCompleted: false })
        .then((data) => ({
          id: student.id,
          status: data,
        })));

    // Wait for all fetch requests to complete
    const results = await Promise.all(statusPromises);

    // Transform the array of results into a lookup object (our state shape)
    const statusMap = results.reduce((acc, result) => {
      acc[result.id] = result.status;
      return acc;
    }, {} as typeof studentsEvalStatus);

    // Update the state with the statuses for all students
    setStudentsEvalStatus(statusMap);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setMessage(`Error: User not found. Cannot submit evaluation.`);
      return;
    }
    setMessage(`Submitting...`);
    try {
      const evalData = {
        criteria: selections,
        evaluationType: user.role,
        semester: selectedSemester,
        studentId: user.id,
        supervisorId: user.supervisorId,
        team: selectedTeam,
        type: user.role,
        year: new Date().getFullYear(),
      };
      if (user.role === `SUPERVISOR`) {
        if (selectedStudentId !== null) {
          evalData.studentId = selectedStudentId;
        } else {
          setMessage(`Error: Please select a student before submitting the evaluation.`);
          return;
        }
        evalData.supervisorId = user.id;
      }

      // eslint-disable-next-line no-console
      console.log(`eval object client : ${JSON.stringify(evalData, null, 2)}`);

      const response = await fetch(`${fetchUrl}/submitEval/`, {
        body: JSON.stringify(evalData),
        credentials: `include`,
        headers: { 'Content-Type': `application/json` },
        method: `POST`,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(String(errorData.message) || `Failed to submit evaluation.`);
      }

      setMessage(`Evaluation submitted successfully!`);
      setTimeout(() => setMessage(``), 3000);
      setIsFormVisible(false);
    } catch (err) {
      if (err instanceof Error) {
        setMessage(`Error: ${err.message}`);
      } else {
        setMessage(`An unknown error occurred.`);
      }
    }
  };

  if (isLoading) {
    return <div className="evaluations-page">
      <h1>Loading...</h1>
    </div>;
  }

  console.log(`Team: `, selectedTeam);

  return <div className="evaluations-page">
    {!isFormVisible && <header className="evaluations-header">
      <h1>Evaluations</h1>
      <p>Complete a new performance evaluation or review previous submissions.</p>
    </header>}

    <div className="action-button-group">
      <div className="eval-cards">
        <h2 className="tc">{user?.role === `STUDENT` ? `Start a Self-Evaluation` : `Start a Supervisor Evaluation`}</h2>
        <p> {user?.role === `STUDENT` ? `Begin a new self-evaluation for this semester` :
          `Select from a list of all your students,
         and complete an evaluation for each this semester.`} </p>
        {user?.role === `STUDENT` &&
          <div className="team-info">
            <strong>Supervisor:</strong>
            {` `}
            {user?.supervisorName || `N/A`}
            <br />
          </div>}
        <button
          className="new-eval-button"
          onClick={async () => {
            setIsPMVisible((prev) => !prev);
            await fetchAllStatuses();
            if (user) {
              await fetchEvalStatusForCurrentUser(user.id);
            }
          }}
        >
          {isFormVisible ? `Close Evaluation Form` : `Start New Evaluation`}
        </button>
      </div>

      <div className="eval-cards">
        <h2 className="tc">Review Past Evaluations</h2>
        <p> Access and review all your previously submitted evaluations,
          along with any evaluations submitted for you.</p>
        {user?.role === `STUDENT` &&
          <button className="view-eval-button" onClick={() => navigate(`/past_evaluations`)}>
            View Past Evaluations</button>}
        {user?.role === `SUPERVISOR` &&
          <button className="view-eval-button" onClick={() => navigate(`/student_select`)}>
            View Past Student Evaluations</button>}
      </div>
    </div>

    {isPreModalVisible && <div id="pre-eval-modal" className="modal-overlay">
      <div className="modal-content">
        <div id="pre-eval-content">
          {user?.role === `STUDENT` &&
            <>
              <h2>Start Self-Evaluation</h2>
              {!canStartSelfEval &&
                <p className="completion-message">
                  You have already completed your evaluation for this semester.
                </p>}
              {canStartSelfEval &&
                <>
                  <p>
                    You are about to begin a new self-evaluation for the
                    <strong> {assignSemester()}</strong>
                    <br />
                    semester. Your responses will be shared with your supervisor,
                    {` `}
                    {user.supervisorName}
                    , upon submission.
                  </p>
                  <p>Please click "Proceed" to continue.</p>
                </>}
            </>}

          {user?.role === `SUPERVISOR` &&
            <>
              {/* This content is now properly centered by its own CSS */}
              <h2>Start Supervisor Evaluation</h2>
              <p>
                You are about to begin a new evaluation for a student.
                Please choose a student from the list below to proceed.
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
                  </tbody>
                </table>
              </div>
            </>}
        </div>
        <div className="modal-footer">
          <button
            type="button"
            className="button-cancel-eval"
            style={{ backgroundColor: `#757575` }}
            data-modal-id="pre-eval-modal"
            onClick={() => {
              setIsPMVisible((prev) => !prev);
            }}
          >Cancel
          </button>
          {canStartSelfEval && <button
            id="proceed-to-eval-btn"
            className="proceed-eval"
            style={{ backgroundColor: `#4CAF50` }}
            onClick={() => {
              setIsFormVisible((prev) => !prev);
              setIsPMVisible((prev) => !prev);
            }}
          >Proceed to Evaluation</button>}
        </div>
      </div>
    </div>}

    {isFormVisible && <div
      id="evaluation-modal"
      className="modal-overlay"
    >
      <div
        className="modal-content"
        style={{ height: `80%`, overflow: `scroll` }}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-header">
            <h2>
              {user?.role === `STUDENT` ?
                `Student Self-Evaluation` :
                `Supervisor Evaluation`}
            </h2>
            <div className="semester-selector">
              <label htmlFor="semester">Team:</label>
              <select
                id="semester"
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
              >
                {user?.teamNames?.map((teamName, index) =>
                  <option key={index} value={teamName}>{teamName}</option>)}
              </select>
            </div>
            <div className="semester-selector">
              <label htmlFor="semester">Semester:</label>
              <select
                id="semester"
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value as `SPRING` | `SUMMER` | `FALL` | `UNKNOWN`)}
              >
                <option value="SPRING">SPRING</option>
                <option value="SUMMER">SUMMER</option>
                <option value="FALL">FALL</option>
              </select>
            </div>
          </div>

          <div className="rubric-table-wrapper">
            <table className="rubric-table">
              <thead>
                <tr>
                  <th>Criteria</th>
                  {rubricData[0].levels.map((element) => <th>{element}</th>)}
                </tr>
              </thead>
              <tbody>
                {rubricData.map((criterion) =>
                  <tr key={criterion.id}>
                    <td className="criteria-column">
                      <strong>{criterion.title}</strong>
                      <ul>
                        {criterion.subCriteria?.map((sub, index) =>
                          <li key={index}>{sub}</li>)}
                      </ul>
                    </td>
                    {criterion.levels.map(
                      (level, index) => {
                        const performanceLevels = criteria[0].levels;
                        type PerformanceLevel = typeof performanceLevels[number];
                        const typedLevel = level;
                        return <td
                          key={level}
                          className={`level-cell ${selections[criterion.id] === level ? `selected` : ``}`}
                          onClick={() => handleSelect(criterion.id, typedLevel)}
                        >
                          <div className="level-text">
                            {criterion.descriptions[index]}
                          </div>
                        </td>;
                      },
                    )}
                  </tr>)}
              </tbody>
            </table>
          </div>

          <div className="modal-footer">
            {message && <p className="submission-message">{message}</p>}
            <button
              type="button"
              className="button-cancel-eval"
              style={{ backgroundColor: `#757575` }}
              data-modal-id="evaluation-modal"
              onClick={() => {
                setIsFormVisible((prev) => !prev);
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="submit-button-eval"
              style={{ backgroundColor: `#4CAF50` }}
            >Submit Evaluation</button>
          </div>
        </form>
      </div>
    </div>}
    <div className="center-text">
      {message && <p className="submission-message">{message}</p>}
    </div>
  </div>;
};

export default Evaluations;
