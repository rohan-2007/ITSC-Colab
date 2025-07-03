import React, { useDeferredValue, useEffect, useState } from 'react';
import type { RubricCategory } from './PastEvaluations';

interface RubricRequestBody {
  categoryId?: number;
  description?: string;
  level?: string;
  levelId?: number;
  prevLevel?: string;
}

const EditRubric: React.FC = () => {
  const [ rubricCategories, setRubricCategories ] = useState<RubricCategory[]>([]);

  const fetchRubricCategories = async () => {
    try {
      const res = await fetch(`http://localhost:3001/rubric`);

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const resJson = await res.json();
      setRubricCategories(resJson as RubricCategory[]);
    } catch (err) {
      console.error(`Rubric categories fetch error:`, err);
    }
  };

  useEffect(() => {
    void fetchRubricCategories();
  }, []);

  const changeDescription = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const [ category, level ] = name.split(`_`);
    const categoryId = parseInt(category, 10);
    const levelId = parseInt(level, 10);
    setRubricCategories((prev) => prev.map((c) => {
      if (c.id !== categoryId) {
        return c;
      }

      return {
        ...c,
        levels: c.levels.map((l) =>
          l.id === levelId ? { ...l, description: value } : l),
      };
    }));

    try {
      const res = await fetch(`http://localhost:3001/changeRubric`, {
        body: JSON.stringify({ categoryId, description: value, levelId }),
        credentials: `include`,
        headers: { "Content-Type": `application/json` },
        method: `POST`,
      });

      const resJson = await res.json();
      console.log(`resJson`, resJson);
    } catch {
      return;
    }
  };

  const changeLevel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRubricCategories((prev) => prev.map((c) => ({
      ...c,
      levels: c.levels.map((l) =>
        l.level === name ? { ...l, level: value } : l),
    })));

    try {
      const res = await fetch(`http://localhost:3001/changeRubric`, {
        body: JSON.stringify({ level: value, prevLevel: name }),
        credentials: `include`,
        headers: { "Content-Type": `application/json` },
        method: `POST`,
      });

      const resJson = await res.json();
      console.log(`resJson`, resJson);
    } catch {
      return;
    }
  };

  return <div className="rubric-table-wrapper-past-eval">
    <table className="rubric-table-past-eval">
      <thead>
        <tr>
          <th>Criteria</th>
          {rubricCategories[0]?.levels.map((level) =>
            <th key={level.id}>
              <input
                value={level.level}
                name={`${level.level}`}
                onChange={changeLevel}
              />
            </th>)}
        </tr>
      </thead>
      <tbody>
        {rubricCategories.map((category) =>
          <tr key={category.id}>
            <td className="criteria-column">
              <strong>{category.title}</strong>
              <ul>
                {category.subItems?.map((subItem) =>
                  <li key={subItem.id}>{subItem.name}</li>)}
              </ul>
            </td>
            {rubricCategories[0]?.levels.map((headerLevel) => {
              const matchingLevel = category.levels.find((l) => l.level === headerLevel.level);
              const cellClass = `display-cell`;

              //   const studentSelected = studentTeamResults[category.id] === level.id;
              //   const supervisorSelected = supervisorTeamResults[category.id] === level.id;
              //   console.log(`supervisorTeamResults[category.id]`, supervisorTeamResults);

              //   if (!(category.id in supervisorTeamResults) && !(category.id in studentTeamResults)) {
              //     if (!alreadyDisplayed) {
              //       alreadyDisplayed = true;
              //       return <td
              //         key={level.id}
              //         style={dynamicStyles}
              //         className={cellClass}
              //         colSpan={category.levels.length}
              //       >
              //         <div className="level-text no-criteria">
              //           This criterion is not available for this evaluation
              //         </div>
              //       </td>;
              //     }
              //   } else {
              //   if (studentSelected && supervisorSelected) {
              //     cellClass += ` both-selected`;
              //   } else if (studentSelected) {
              //     cellClass += ` student-selected`;
              //   } else if (supervisorSelected) {
              //     cellClass += ` supervisor-selected`;
              //   }

              return <td
                key={headerLevel.id}
                // style={dynamicStyles}
                className={cellClass}
              >
                <div className="level-text">
                  <input
                    value={matchingLevel?.description}
                    name={`${category.id}_${matchingLevel?.id}`}
                    onChange={changeDescription}
                  />
                </div>
              </td>;
            //   }
            })}
          </tr>)}
      </tbody>
    </table>
  </div>;
};

export default EditRubric;
