/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import React, { JSX, useEffect, useRef, useState } from 'react';
import './evaluations.css';
import { useNavigate } from 'react-router-dom';
const fetchUrl = `http://localhost:3001`;

const Evaluations: React.FC = () => {
  // interface DropdownProps {
  //   onSelect: (value: string) => void;
  //   options: string[];
  // }

  // const [ isOpenSemesterSelect, setIsOpenSemesterSelect ] = useState(false);
  // const [ selectedValue, setSelectedValue ] = useState(``);
  // const dropdownRef = useRef<HTMLDivElement>(null);
  const toggleDropdown = () => setIsOpenSemesterSelect((prev) => !prev);
  const closeDropdown = () => setShowDropDown(false);

  // const handleSelect = (value: string) => {
  //   setSelectedValue(value);
  //   onselect(value);
  //   setIsOpenSemesterSelect(false);
  // };

  // const handleClickOutside = (event: MouseEvent) => {
  //   if ()
  // }

  const PORT = 3001;

  const currentDate = () => {
    const date = new Date();
    return date;
  };

  // const assignSemester = () => {
  //   const today: Date = currentDate();
  //   today.setHours(0, 0, 0, 0);
  //   // const dateOnly = today.toLocaleDateString(`en-GB`);
  //   const year = today.getFullYear();
  //   const summerStart = new Date(year, 5, 12); // June 12
  //   const summerEnd = new Date(year, 7, 9); // August 9
  //   const fallStart = new Date(year, 7, 25); // August 25
  //   const fallEnd = new Date(year, 11, 5); // December 5
  //   const springStart = new Date(year + 1, 0, 12); // January 12 of next year
  //   const springEnd = new Date(year + 1, 3, 24); // April 24 of next year

  //   console.log(`summerStart: ${summerStart.toDateString()}`);
  //   console.log(`Today: ${today}`);

  //   if (today >= summerStart && today <= summerEnd) {
  //     return `SUMMER`;
  //   } else if (today >= fallStart && today <= fallEnd) {
  //     return `FALL`;
  //   } else if (today >= springStart && today <= springEnd) {
  //     return `SPRING`;
  //   }
  //   return `UNKNOWN`;
  // };

  const assignSemester = (): string => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to midnight

    const year = today.getFullYear();
    const summerStart = new Date(year, 4, 12); // May 12
    const summerEnd = new Date(year, 7, 9); // August 9
    const fallStart = new Date(year, 7, 25); // August 25
    const fallEnd = new Date(year, 11, 5); // December 5
    const springStart = new Date(year, 0, 12); // January 12 of next year
    const springEnd = new Date(year, 3, 24); // April 24 of next year

    if (today >= summerStart && today <= summerEnd) {
      return `SUMMER`;
    } else if (today >= fallStart && today <= fallEnd) {
      return `FALL`;
    } else if (today >= springStart && today <= springEnd) {
      return `SPRING`;
    }
    console.log(`unknown semester`, today < summerStart, today > summerEnd);
    return `UNKNOWN`;
  };

  const handleEvalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // currentDate();
    console.log(`f`);
    console.log(`criteria1: ${criteria1}`);
    console.log(`criteria2: ${criteria2}`);
    console.log(`criteria3: ${criteria3}`);
    console.log(`criteria4: ${criteria4}`);

    try {
      const res = await fetch(`${fetchUrl}/me/`, {
        body: JSON.stringify({ returnData: true }),
        credentials: `include`,
        headers: {
          'Content-Type': `application/json`,
        },
        method: `POST`,
      });

      const resJson = await res.json();
      if (!res.ok) {
        console.log(`Response not ok, throwing error`);
        throw new Error(resJson.message || `user session not found`);
      }
      console.log(`resJson: `, JSON.stringify(resJson, null, 2));
      console.log(`Before evalData creation`);
      const evalData = {
        criteria: {
          criteria1,
          criteria2,
          criteria3,
          criteria4,
        },
        evaluationType: resJson.user.role,
        semester: selectedSemester,
        supervisorId: resJson.user.role === `SUPERVISOR` ? resJson.user.userId : resJson.user.supervisorId,
        userId: resJson.user.id,
      };

      console.log(`bbbbb`, JSON.stringify(evalData, null, 2));

      const response = await fetch(`${fetchUrl}/submitEval/`, {
        body: JSON.stringify(evalData),
        credentials: `include`,
        headers: { 'Content-Type': `application/json` },
        method: `POST`,
      });
    } catch (err) {
      if (err instanceof Error) {
        setMessage(`Evaluation submit error: ${err.message}`);
      } else {
        setMessage(`An unknown error occured`);
      }
    }
  };

  const [ message, setMessage ] = useState(``);
  const [ criteria1, setCriteria1 ] = useState(`starting`);
  const [ criteria2, setCriteria2 ] = useState(`starting`);
  const [ criteria3, setCriteria3 ] = useState(`starting`);
  const [ criteria4, setCriteria4 ] = useState(`starting`);

  const [ showDropDown, setShowDropDown ] = useState(false);
  const [ selectedSemester, setSelectedSemester ] = useState(assignSemester());

  // const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
  //   if (e.key === `Enter` || e.key === ` `) {
  //     toggleDropdown();
  //   } else if (e.key === `Escape`) {
  //     closeDropdown();
  //   }
  // };

  const semesters = [ `SPRING`, `FALL`, `SUMMER` ];

  const [ isOpenSemesterSelect, setIsOpenSemesterSelect ] = useState(true);

  // const toggleDropdown = () => setIsOpen(prev => !prev);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === `Enter` || event.key === ` `) {
      toggleDropdown();
    } else if (event.key === `Escape`) {
      setIsOpenSemesterSelect(false);
    }
  };

  const onClickHandler = (semester: string): void => {
    setSelectedSemester(semester);
  };

  const [ isOpenNewEval, setIsOpenNewEval ] = useState(false);
  const toggleNewEval = () => setIsOpenNewEval((prev) => !prev);

  const navigate = useNavigate();

  const viewPastEvalPage = async () => {
    await navigate(`/past_evaluations`);
  };

  useEffect(() => {
    setShowDropDown(showDropDown);
  }, [ showDropDown ]);

  return <div className="evaluations-page">

    <h1>Evaluations</h1>

    <h3>Here, you can add your evaluations. To view past evaluations, click "View Past Evaluations".</h3>

    <button className="eval-button" onClick={toggleNewEval}>Add Evaluation</button>

    <button className="eval-button" onClick={viewPastEvalPage}>View Past Evaluations</button>

    {isOpenNewEval &&
      <div className="evalContainer">

        <div
          tabIndex={0}
          onClick={toggleDropdown}
          onKeyDown={handleKeyDown}
          role="button"
          aria-expanded={isOpenSemesterSelect}
          aria-haspopup="listbox"
        >
          {selectedSemester || `Select Semester`}
        </div>
        {isOpenSemesterSelect &&
          <ul role="listbox">
            {semesters.map((option, index) =>
              <li
                className="semester-option"
                // key={index}
                role="option"
                tabIndex={0}
                aria-selected={selectedSemester === option}
                onClick={() => onClickHandler(option)}
                onKeyDown={(e) => {
                  if (e.key === `Enter` || e.key === ` `) {
                    onClickHandler(option);
                  }
                }}
              >
                {option}
              </li>)}
          </ul>}

        <form>

          {/* <div tabIndex={0} onKeyDown={handleKeyDown} className={showDropDown ? `dropdown` : `dropdown active`}>
            {semesters.map(
              (city: string, index: number): JSX.Element =>
                <p
                  key={index}
                  onClick={(): void => {
                    onClickHandler(city);
                  }}
                  onKeyDown={handleKeyDown}
                >
                  {city}
                </p>,
            )}
          </div> */}

          <fieldset className="criteria">
            <legend>Critical Thinking/Problem Solving:</legend>
            <label className="evaluation-btn">
              <input
                type="radio"
                name="criteria1"
                value="starting"
                checked={criteria1 === `starting`}
                onChange={(e) => setCriteria1(e.target.value)}
              />
              Starting
            </label>
            <label className="evaluation-btn">
              <input
                type="radio"
                name="criteria1"
                value="inProgress"
                checked={criteria1 === `inProgress`}
                onChange={(e) => setCriteria1(e.target.value)}
              />
              In Progress
            </label>
            <label className="evaluation-btn">
              <input
                type="radio"
                name="criteria1"
                value="competitive"
                checked={criteria1 === `competitive`}
                onChange={(e) => setCriteria1(e.target.value)}
              />
              Competitive
            </label>
          </fieldset>

          <fieldset className="criteria">
            <legend>Technical Proficiency:</legend>
            <label className="evaluation-btn">
              <input
                type="radio"
                name="criteria2"
                value="starting"
                checked={criteria2 === `starting`}
                onChange={(e) => setCriteria2(e.target.value)}
              />
              Starting
            </label>
            <label className="evaluation-btn">
              <input
                type="radio"
                name="criteria2"
                value="inProgress"
                checked={criteria2 === `inProgress`}
                onChange={(e) => setCriteria2(e.target.value)}
              />
              In Progress
            </label>
            <label className="evaluation-btn">
              <input
                type="radio"
                name="criteria2"
                value="competitive"
                checked={criteria2 === `competitive`}
                onChange={(e) => setCriteria2(e.target.value)}
              />
              Competitive
            </label>
          </fieldset>

          <fieldset className="criteria">
            <legend>Teamwork:</legend>
            <label className="evaluation-btn">
              <input
                type="radio"
                name="criteria3"
                value="starting"
                checked={criteria3 === `starting`}
                onChange={(e) => setCriteria3(e.target.value)}
              />
              Starting
            </label>
            <label className="evaluation-btn">
              <input
                type="radio"
                name="criteria3"
                value="inProgress"
                checked={criteria3 === `inProgress`}
                onChange={(e) => setCriteria3(e.target.value)}
              />
              In Progress
            </label>
            <label className="evaluation-btn">
              <input
                type="radio"
                name="criteria3"
                value="competitive"
                checked={criteria3 === `competitive`}
                onChange={(e) => setCriteria3(e.target.value)}
              />
              Competitive
            </label>
          </fieldset>

          <fieldset className="criteria">
            <legend>Personal Disposition:</legend>
            <label className="evaluation-btn">
              <input
                type="radio"
                name="criteria4"
                value="starting"
                checked={criteria4 === `starting`}
                onChange={(e) => setCriteria4(e.target.value)}
              />
              Starting
            </label>
            <label className="evaluation-btn">
              <input
                type="radio"
                name="criteria4"
                value="inProgress"
                checked={criteria4 === `inProgress`}
                onChange={(e) => setCriteria4(e.target.value)}
              />
              In Progress
            </label>
            <label className="evaluation-btn">
              <input
                type="radio"
                name="criteria4"
                value="competitive"
                checked={criteria4 === `competitive`}
                onChange={(e) => setCriteria4(e.target.value)}
              />
              Competitive
            </label>
          </fieldset>

          <button type="submit" onClick={handleEvalSubmit}>Submit</button>
        </form>
      </div>}
  </div>;
};

export default Evaluations;
