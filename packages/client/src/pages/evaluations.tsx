import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './evaluations.css';

const fetchUrl = `http://localhost:3001`;

type PerformanceLevel = `starting` | `inProgress` | `competitive`;
type Selections = Record<string, PerformanceLevel>;

interface User {
  id: number;
  role: `STUDENT` | `SUPERVISOR`;
  supervisorId: number | null;
  supervisorName: string;
}

const rubricData = [
  {
    id: `criticalThinking`,
    levels: {
      competitive: `Demonstrates outstanding adaptability to new situations and challenges.`,
      inProgress: `Adapts to new situations effectively.`,
      starting: `Resists change and struggles to adapt to new situations.`,
    },
    subCriteria: [ `Problem solving`, `Adaptability` ],
    title: `Critical Thinking/Problem Solving`,
  },
  {
    id: `technicalProficiency`,
    levels: {
      competitive: `Performs complex tasks, and consistently demonstrates a high level of technical expertise.`,
      inProgress: `Capable of performing and solving problems. Can meet the technical requirements of the role.`,
      starting: `Demonstrates limited technical skills and knowledge. Struggles to perform tasks.`,
    },
    subCriteria: [ `Git (version control)`, `GitHub`, `Application admin`, `(Knowledge, Speed, Productivity)` ],
    title: `Technical Proficiency`,
  },
  {
    id: `teamwork`,
    levels: {
      competitive: `Inspires and uplifts teams to while focusing on accountability and initiative flexibility.`,
      inProgress: `Maintains team-oriented mind by being accountable, taking initiative, and being flexible on tasks.`,
      starting: `Works in isolation and avoids collaboration. Shows resistance to sharing work with others.`,
    },
    subCriteria: [ `Collaboration`, `Prioritization`, `Accountability`, `Initiative`, `Flexibility`, `Integrity` ],
    title: `Teamwork`,
  },
  {
    id: `personalDisposition`,
    levels: {
      competitive: `High interpersonal skills can be seen through conversations. Consistently meets deadlines.`,
      inProgress: `Shows good range of interpersonal skills. Displays competent skills. Provides clear direction.`,
      starting: `Low interpersonal skills. This is evident by: lack of listening, struggling to complete work on time.`,
    },
    subCriteria: [ `Communication`, `Time management`, `Organization`, `Adaptability`, `Patience` ],
    title: `Personal Disposition`,
  },
];

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

const Evaluations: React.FC = () => {
  const navigate = useNavigate();
  const [ user, setUser ] = useState<User | null>(null);
  const [ isLoading, setIsLoading ] = useState(true);
  const [ isFormVisible, setIsFormVisible ] = useState(false);
  const [ isPreModalVisible, setIsPMVisible ] = useState(false);
  const [ selections, setSelections ] = useState<Selections>(
    rubricData.reduce((acc, cr) => ({ ...acc, [cr.id]: `starting` }), {}),
  );
  const [ selectedSemester, setSelectedSemester ] = useState(assignSemester());
  const [ message, setMessage ] = useState(``);
  const [ studentEvalId, setStudentEvalId ] = useState(0);

  useEffect(() => {
    const checkSession = async () => {
      setIsLoading(true);

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
      } finally {
        setIsLoading(false);
      }
    };

    void checkSession();
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
          role: data.user.role,
          supervisorId: data.user.supervisorId || null,
          supervisorName: data.user.supervisorName,
        });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(`Failed to fetch user data: ${err instanceof Error ? err.message : String(err)}`);
        await navigate(`/login`);
      } finally {
        setIsLoading(false);
      }
    };
    void fetchUser();
  }, [ navigate ]);

  const handleSelect = (criterionId: string, level: PerformanceLevel) => {
    setSelections((prev) => ({ ...prev, [criterionId]: level }));
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
        type: user.role,
      };
      if (user.role === `SUPERVISOR`) {
        evalData.studentId = studentEvalId;
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

  return <div className="evaluations-page">
    {!isFormVisible && <header className="evaluations-header">
      <h1>Evaluations</h1>
      <p>Complete a new performance evaluation or review previous submissions.</p>
    </header>}

    <div className="action-button-group">
      <div className="dashboard-card">
        <h2>{user?.role === `STUDENT` ? `Start a Self-Evaluation` : `Start a Supervisor Evaluation`}</h2>
        <div className="team-info">
          <strong>Supervisor:</strong>
          {` `}
          {user?.supervisorName || `N/A`}
          <br />
        </div>
        <button
          className="btn primary-btn large-btn"
          onClick={() => setIsPMVisible((prev) => !prev)}
        >
          {isFormVisible ? `Close Evaluation Form` : `Start New Evaluation`}
        </button>
      </div>

      <div className="dashboard-card">
        <h2>Review Past Evaluations</h2>
        <p> Access and review all your previously submitted evaluations,
          along with any evaluations submitted for you.</p>
        <button className="btn secondary-btn" onClick={() => navigate(`/past_evaluations`)}>
          View Past Evaluations</button>
      </div>
    </div>

    {isPreModalVisible && <div id="pre-eval-modal" className="modal-overlay">
      <div className="modal-content">
        <div id="pre-eval-content">
          {user?.role === `STUDENT` &&
            <>
              <h2>Start Self-Evaluation</h2>
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
          {user?.role === `SUPERVISOR` &&
            <>
              <h2>Start Supervisor Evaluation</h2>
              <p>You are about to begin a new evaluation for a student. Please enter the student's ID to proceed.</p>
              <div className="form-group">
                <label htmlFor="student-id">Student ID</label>
                <input
                  type="text"
                  id="student-id"
                  placeholder="e.g., 12345678"
                  required
                  onChangeCapture={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setStudentEvalId(Number(e.target.value));
                  }}
                />

              </div>
            </>}
        </div>
        <div className="modal-footer">
          <button
            type="button"
            className="btn secondary-btn"
            style={{ backgroundColor: `#757575` }}
            data-modal-id="pre-eval-modal"
            onClick={() => {
              setIsPMVisible((prev) => !prev);
            }}
          >Cancel
          </button>
          <button
            id="proceed-to-eval-btn"
            className="btn primary-btn"
            style={{ backgroundColor: `#4CAF50` }}
            onClick={() => {
              setIsFormVisible((prev) => !prev);
              setIsPMVisible((prev) => !prev);
            }}
          >Proceed to Evaluation</button>
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
        <div className="modal-close">X</div>
        <form onSubmit={handleSubmit}>
          <div className="form-header">
            <h2>
              {user?.role === `STUDENT` ?
                `Student Self-Evaluation` :
                `Supervisor Evaluation`}
            </h2>
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
                  <th>Starting</th>
                  <th>In Progress</th>
                  <th>Competitive</th>
                </tr>
              </thead>
              <tbody>
                {rubricData.map((criterion) =>
                  <tr key={criterion.id}>
                    <td className="criteria-column">
                      <strong>{criterion.title}</strong>
                      <ul>
                        {criterion.subCriteria.map((sub, index) =>
                          <li key={index}>{sub}</li>)}
                      </ul>
                    </td>
                    {([ `starting`, `inProgress`, `competitive` ] as PerformanceLevel[]).map(
                      (level) =>
                        <td
                          key={level}
                          className={`level-cell ${selections[criterion.id] === level ? `selected` : ``}`}
                          onClick={() => handleSelect(criterion.id, level)}
                        >
                          <div className="level-text">
                            {criterion.levels[level]}
                          </div>
                        </td>,

                    )}
                  </tr>)}
              </tbody>
            </table>
          </div>

          <div className="modal-footer">
            {message && <p className="submission-message">{message}</p>}
            <button
              type="button"
              className="btn secondary-btn"
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
              className="btn primary-btn"
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
