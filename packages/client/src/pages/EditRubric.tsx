import React, { useEffect, useState } from 'react';
import type { RubricCategory } from './PastEvaluations';

// interface RubricRequestBody {
//   categoryId?: number;
//   categoryTitle?: string;
//   description?: string;
//   level?: string;
//   levelId?: number;
//   prevLevel?: string;
// }

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

  const changeSubItem = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const [ subItem, category ] = name.split(`_`);
    const categoryId = parseInt(category, 10);
    // const subItemIdAppended = parseInt([ category, `0`, subItem ].join(), 10);
    const subItemId = parseInt(subItem, 10);
    setRubricCategories((prev) => prev.map((c) => {
      if (c.id !== categoryId) {
        return c;
      }

      return {
        ...c,
        subItems: c.subItems.map((si) => si.id === subItemId ? { ...si, name: value } : si),
      };
    }));

    try {
      console.log(`subItem: `, value);
      console.log(`subItemId: `, subItemId);
      const res = await fetch(`http://localhost:3001/changeRubric`, {
        body: JSON.stringify({ subItem: value, subItemId }),
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

  const createNewLevel = async () => {
    try {
      const res = await fetch(`http://localhost:3001/changeRubric`, {
        body: JSON.stringify({ addLevel: true }),
        credentials: `include`,
        headers: { "Content-Type": `application/json` },
        method: `POST`,
      });

      const resJson = await res.json();
      console.log(`resJson`, resJson);

      await fetchRubricCategories();
      console.log(`updatedCategories: `, rubricCategories);
    } catch {
      return;
    }
  };

  const changeCategory = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const categoryId = parseInt(name);
    setRubricCategories((prev) => prev.map((c) => {
      if (c.id !== categoryId) {
        return c;
      }

      return {
        ...c,
        title: value,
      };
    }));

    try {
      const res = await fetch(`http://localhost:3001/changeRubric`, {
        body: JSON.stringify({ categoryId, categoryTitle: value }),
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

  const deleteLevel = async (levelId: number) => {
    try {
      const res = await fetch(`http://localhost:3001/changeRubric`, {
        body: JSON.stringify({ deletedLevel: levelId }),
        credentials: `include`,
        headers: { "Content-Type": `application/json` },
        method: `POST`,
      });

      console.log(`in deleteLevel`);

      const resJson = await res.json();
      console.log(`resJson`, resJson);

      await fetchRubricCategories();
      // console.log(`updatedCategories: `, rubricCategories);
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
                className="change-rubric-input"
                value={level.level}
                name={`${level.level}`}
                onChange={changeLevel}
              />
              <button onClick={() => deleteLevel(level.id)}>Delete</button>
            </th>)}
          <th>
            <button onClick={createNewLevel}>Add Level</button>
          </th>
        </tr>
      </thead>
      <tbody>
        {rubricCategories.map((category) =>
          <tr key={category.id}>
            <td className="criteria-column">
              <strong>
                <input
                  className="change-rubric-input"
                  value={category.title}
                  name={`${category.id}`}
                  onChange={changeCategory}
                />
              </strong>
              <ul>
                {category.subItems?.map((subItem) =>
                  <li key={subItem.id}>
                    <input
                      className="change-rubric-input"
                      value={subItem.name}
                      name={`${subItem.id}_${category.id}`}
                      onChange={changeSubItem}
                    />
                  </li>)}
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

                <input
                  className="change-rubric-input"
                  value={matchingLevel?.description}
                  name={`${category.id}_${matchingLevel?.id}`}
                  onChange={changeDescription}
                />
              </td>;
            //   }
            })}
          </tr>)}
      </tbody>
    </table>
  </div>;
};

export default EditRubric;
