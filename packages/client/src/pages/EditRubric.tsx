import React, { useEffect, useState } from 'react';
import type { RubricCategory } from './PastEvaluations';

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

  return <div className="rubric-table-wrapper-past-eval">
    <table className="rubric-table-past-eval">
      <thead>
        <tr>
          <th>Criteria</th>
          {rubricCategories[0]?.levels.map((level) =>
            <th key={level.id}>{level.level}</th>)}
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
            {category.levels.map((level) => {
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
                key={level.id}
                // style={dynamicStyles}
                className={cellClass}
              >
                <div className="level-text">
                  {level.description}
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
