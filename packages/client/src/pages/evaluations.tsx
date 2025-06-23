import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from './PastEvaluations';
import './evaluations.css';
import '../components/buttonandcard.css';

const fetchUrl = `http://localhost:3001`;

interface RubricCategoryData {
  id: number;
  descriptionCompetitive: string;
  descriptionInProgress: string;
  descriptionStarting: string;
  name: string;
  subItems: string[];
  title: string;
}

const performanceLevels = [
  { key: `starting`, subtitle: `(students will start their journey here)`, title: `Starting` },
  { key: `inProgress`, subtitle: `(students seek to reach this level)`, title: `In Progress` },
  { key: `competitive`, subtitle: `(should aim this level upon graduation)`, title: `Competitive` },
] as const;

type PerformanceLevelKey = typeof performanceLevels[number][`key`];
type Selections = Record<string, PerformanceLevelKey>;

const assignSemester = (): `SPRING` | `SUMMER` | `FALL` | `N/A` => {
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
  return `N/A`;
};

interface Student {
  id: number;
  email: string;
  name: string;
  password: string;
  supervisorId: number;
}

// Type for evaluation status, assuming what the backend might return
interface EvalStatus {
  studentCompleted: boolean;
  supervisorCompleted: boolean;
}

const Evaluations: React.FC = () => {
  const navigate = useNavigate();
  const [ user, setUser ] = useState<User | null>(null);
  const [ isLoading, setIsLoading ] = useState(true);
  const [ isFormVisible, setIsFormVisible ] = useState(false);
  const [ isPreModalVisible, setIsPreModalVisible ] = useState(false);
  const [ selectedStudentId, setSelectedStudentId ] = useState<number | null>(null);
  const [ selectedSemester, setSelectedSemester ] = useState<`SPRING` | `SUMMER` | `FALL` | `N/A`>(assignSemester());
  const [ message, setMessage ] = useState(``);
  const [ students, setStudents ] = useState<Student[]>([]);
  const [ selectedTeam, setSelectedTeam ] = useState(
    user?.teamNames ? user.teamNames[0] : `no team`,
  );
  const [ rubricCategories, setRubricCategories ] = useState<RubricCategoryData[]>([]);
  const [ selections, setSelections ] = useState<Selections>({});
  const [ studentSearch, setStudentSearch ] = useState(``);
  const [ studentsEvalStatus, setStudentsEvalStatus ] = useState<Record<number, EvalStatus>>({});
  const [ canStartSelfEval, setCanStartSelfEval ] = useState(true);

  const fetchAllStatuses = async () => {
    const currentSemester = assignSemester();
    const currentYear = new Date().getFullYear();

    if (currentSemester === `N/A`) {
      // eslint-disable-next-line no-console
      console.warn(`Cannot fetch statuses: Not within a valid semester.`);
      return;
    }

    try {
      const response = await fetch(
        `${fetchUrl}/supervisorEvals?semester=${currentSemester}&year=${currentYear}`,
        {
          credentials: `include`,
          method: `GET`,
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch student evaluation statuses`);
      }

      const data = await response.json();
      setStudentsEvalStatus(data as Record<number, EvalStatus>);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      // eslint-disable-next-line no-console
      console.warn(`Error fetching evaluation statuses: ${errorMsg}`);
      setStudentsEvalStatus({});
    }
  };

  const fetchEvalStatusForCurrentUser = async () => {
    const currentSemester = assignSemester();
    const currentYear = new Date().getFullYear();

    if (currentSemester === `N/A`) {
      setCanStartSelfEval(false); // Can't start if not in a semester
      setMessage(`Evaluations can only be started during the SPRING, SUMMER, or FALL semesters.`);
      return;
    }

    try {
      const response = await fetch(
        `${fetchUrl}/evalStatus/self?semester=${currentSemester}&year=${currentYear}`,
        {
          credentials: `include`,
          method: `GET`,
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch self-evaluation status`);
      }

      const data = await response.json() as { studentCompleted: boolean };
      setCanStartSelfEval(!data.studentCompleted);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      // eslint-disable-next-line no-console
      console.warn(`Error fetching self-evaluation status: ${errorMsg}`);
      setCanStartSelfEval(true);
    }
  };
  const getRubricData = async () => {
    try {
      const res = await fetch(`${fetchUrl}/rubric/`, { method: `GET` });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json() as RubricCategoryData[];
      setRubricCategories(data);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      // eslint-disable-next-line no-console
      console.warn(`Rubric fetch error: ${errorMsg}`);
    }
  };

  useEffect(() => {
    if (rubricCategories.length > 0) {
      const initialSelections = rubricCategories.reduce((acc, category) => {
        acc[category.name] = `starting`;
        return acc;
      }, {} as Selections);
      setSelections(initialSelections);
    }
  }, [ rubricCategories ]);

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
        const [ team ] = data.user.teamNames;
        setSelectedTeam(typeof team === `string` ? team : `no team`);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        // eslint-disable-next-line no-console
        console.warn(`Failed to fetch user data: ${errorMsg}`);
      } finally {
        setIsLoading(false);
      }
    };
    void fetchUser();
    void getRubricData();
  }, [ navigate ]);

  const handleSelect = (criterionName: string, level: PerformanceLevelKey) => {
    setSelections((prev) => ({ ...prev, [criterionName]: level }));
  };

  const fetchStudents = async () => {
    const response = await fetch(`${fetchUrl}/students/`, {
      credentials: `include`,
      headers: { 'Content-Type': `application/json` },
      method: `POST`,
    });
    if (!response.ok) {
      // eslint-disable-next-line no-console
      console.warn(`Failed to fetch students`);
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
      setMessage(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // Derived state for filtering students based on search input
  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      student.email.toLowerCase().includes(studentSearch.toLowerCase()),
  );

  if (isLoading) {
    return <div className="evaluations-page">
      <h1>Loading...</h1>
    </div>;
  }

  return <div className="evaluations-page">
    {!isFormVisible &&
      <header className="evaluations-header">
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
            setIsPreModalVisible(true);
            if (user?.role === `SUPERVISOR`) {
              await fetchStudents();
              await fetchAllStatuses();
            }
            if (user?.role === `STUDENT` && user.id) {
              await fetchEvalStatusForCurrentUser();
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
              <h2>Start Supervisor Evaluation</h2>
              <p>
                You are about to begin a new evaluation for a student.
                Please choose a student from the list below to proceed.
              </p>

              <div className="form-group">
                <label htmlFor="student-search">Search Students:</label>
                <input
                  id="student-search"
                  type="text"
                  placeholder="e.g., Alice Johnson or alice@example.com"
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
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.length > 0 ?
                      filteredStudents.map((student: Student) => {
                        const status = studentsEvalStatus[student.id];
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
              setIsPreModalVisible(false);
            }}
          >Cancel
          </button>
          {/* This button logic now works for both roles */}
          {(user?.role === `STUDENT` ? canStartSelfEval : user?.role === `SUPERVISOR`) &&
            <button
              id="proceed-to-eval-btn"
              className="proceed-eval"
              style={{ backgroundColor: `#4CAF50` }}
              onClick={() => {
                setIsFormVisible(true);
                setIsPreModalVisible(false);
              }}
              disabled={user?.role === `SUPERVISOR` &&
                (selectedStudentId === null || studentsEvalStatus[selectedStudentId]?.supervisorCompleted)}
            >Proceed to Evaluation</button>}
        </div>
      </div>
    </div>}

    {isFormVisible && <div id="evaluation-modal" className="modal-overlay">
      <div className="modal-content" style={{ height: `80%`, overflow: `scroll` }}>
        <form onSubmit={handleSubmit}>

          <div className="form-header">
            <h2>
              {user?.role === `STUDENT` ?
                `Student Self-Evaluation` :
                `Supervisor Evaluation`}
            </h2>
            <div className="semester-selector">
              <label htmlFor="team">Team:</label>
              <select
                id="team"
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
                onChange={(e) => setSelectedSemester(e.target.value as `SPRING` | `SUMMER` | `FALL` | `N/A`)}
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
                  <th>Criteria/Level of performance</th>
                  {performanceLevels.map((level) =>
                    <th key={level.key}>
                      {level.title}
                      <br />
                      <span style={{ fontSize: `0.9em`, fontWeight: `normal` }}>
                        {level.subtitle}
                      </span>
                    </th>)}
                </tr>
              </thead>
              <tbody>
                {rubricCategories.map((category) =>
                  <tr key={category.id}>
                    <td className="criteria-column">
                      <strong>{category.title}</strong>
                      <ul>
                        {category.subItems?.map((sub, index) =>
                          <li key={index}>{sub}</li>)}
                      </ul>
                    </td>
                    {performanceLevels.map((level) => {
                      const descriptionKey =
                        `description${
                          level.key.charAt(0).toUpperCase() + level.key.slice(1)
                        }` as keyof RubricCategoryData;
                      const description = category[descriptionKey] ?? ``; // Safely access property

                      return <td
                        key={level.key}
                        className={`level-cell ${selections[category.name] === level.key ? `selected` : ``}`}
                        onClick={() => handleSelect(category.name, level.key)}
                      >
                        <div className="level-text">
                          {description}
                        </div>
                      </td>;
                    })}
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
                setIsFormVisible(false);
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
