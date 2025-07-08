/* eslint-disable no-console */
import React, { useEffect, useState } from 'react';
import {
  DragDropContext,
  Draggable,
  Droppable,
  DropResult,
} from '@hello-pangea/dnd';
import { type RubricCategory, RubricPerformanceLevel } from './PastEvaluations';
import '../CSS/EditRubric.css';
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
  const [ columns, setColumns ] = useState<RubricPerformanceLevel[]>();

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

  useEffect(() => {
    setColumns(rubricCategories[0]?.levels.filter((level) => !level.deletedAt));
  }, [ rubricCategories ]);

  const changeDescription = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
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

      setRubricCategories((prev) =>
        prev.map((category) => ({
          ...category,
          levels: [
            ...category.levels,
            {
              ...resJson,
              id: category.id * 100 + (category.levels.length + 1),
              rubricCategoryId: category.id,
            },
          ],
        })));

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
        name: value,
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

      setRubricCategories((prev) =>
        prev.map((category) => ({
          ...category,
          levels: category.levels.filter((level) => level.id !== levelId),
        })));

      await fetchRubricCategories();
      // console.log(`updatedCategories: `, rubricCategories);
    } catch {
      return;
    }
  };

  const createNewCriterion = async () => {
    try {
      const res = await fetch(`http://localhost:3001/changeRubric`, {
        body: JSON.stringify({ addCategory: true }),
        credentials: `include`,
        headers: { "Content-Type": `application/json` },
        method: `POST`,
      });

      const resJson: RubricCategory = await res.json();
      console.log(`resJson`, resJson);

      setRubricCategories((prev) =>
        [ ...prev, resJson ]);

      // {
      //     ...resJson,
      //     id: prev.length > 0 ? prev[prev.length - 1].id + 1 : 1,
      //     levels: resJson.levels.map((level) => ({
      //       ...level,
      //       id: resJson.id * 100 + level.id,
      //       rubricCategoryId: resJson.id,
      //     })), title: ``,
      //   }

      await fetchRubricCategories();
      console.log(`updatedCategories: `, rubricCategories);
    } catch {
      return;
    }
  };

  const deleteCriterion = async (criterionId: number) => {
    try {
      const res = await fetch(`http://localhost:3001/changeRubric`, {
        body: JSON.stringify({ deletedCategory: criterionId }),
        credentials: `include`,
        headers: { "Content-Type": `application/json` },
        method: `POST`,
      });

      console.log(`in deleteCriterion`);

      const resJson = await res.json();
      console.log(`resJson`, resJson);

      setRubricCategories((prev) =>
        prev.filter((category) => category.id !== criterionId));

      await fetchRubricCategories();
      // console.log(`updatedCategories: `, rubricCategories);
    } catch {
      return;
    }
  };

  const addSubItem = async (categoryId: number) => {
    try {
      const res = await fetch(`http://localhost:3001/changeRubric`, {
        body: JSON.stringify({ addSubItem: true, categoryId }),
        credentials: `include`,
        headers: { "Content-Type": `application/json` },
        method: `POST`,
      });

      const resJson = await res.json();
      console.log(`resJson`, resJson);

      setRubricCategories((prev) =>
        prev.map((category) => ({
          ...category,
          subItems: [
            ...category.subItems,
            resJson,
          ],
        })));

      await fetchRubricCategories();
      console.log(`updatedCategories: `, rubricCategories);
    } catch {
      return;
    }
  };

  const deleteSubItem = async (subItemId: number) => {
    try {
      const res = await fetch(`http://localhost:3001/changeRubric`, {
        body: JSON.stringify({ deletedSubItem: subItemId }),
        credentials: `include`,
        headers: { "Content-Type": `application/json` },
        method: `POST`,
      });

      const resJson = await res.json();
      console.log(`resJson`, resJson);

      setRubricCategories((prev) =>
        prev.map((category) => ({
          ...category,
          subItems: category.subItems.filter((si) => si.id !== subItemId),
        })));

      await fetchRubricCategories();
      // console.log(`updatedCategories: `, rubricCategories);
    } catch {
      return;
    }
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) {
      return;
    }

    const updated = Array.from(columns ?? []);
    const [ moved ] = updated.splice(result.source.index, 1);
    updated.splice(result.destination.index, 0, moved);
    setColumns(updated);
  };

  return <div className="rubric-table-wrapper-past-eval">
    <DragDropContext onDragEnd={onDragEnd}>
      <table className="rubric-table-past-eval">
        <thead>
          <Droppable droppableId="columns" direction="horizontal">
            {(provided) =>
              <tr ref={provided.innerRef} {...provided.droppableProps}>
                <th>Criteria</th>
                {columns?.map((level, index) =>
                  <Draggable key={level.id} draggableId={`${level.id}`} index={index}>
                    {(providedDrag) =>
                      <th
                        key={level.id}
                        ref={providedDrag.innerRef}
                        {...providedDrag.draggableProps}
                        {...providedDrag.dragHandleProps}
                      >
                        <input
                          className="change-rubric-input"
                          value={level.level}
                          name={`${level.level}`}
                          onChange={changeLevel}
                        />
                        <button
                          onClick={() => deleteLevel(level.id)}
                          className="edit-rubric-btn delete-level-btn"
                        >Delete Level</button>
                      </th>}
                  </Draggable>)}
                {provided.placeholder}
                <th>
                  <button onClick={createNewLevel} className="edit-rubric-btn">Add Level</button>
                </th>
              </tr>}
          </Droppable>
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
                    <li key={subItem.id} className="subitem-list-item">
                      <input
                        className="change-rubric-input"
                        value={subItem.name}
                        name={`${subItem.id}_${category.id}`}
                        onChange={changeSubItem}
                      />
                      <button
                        onClick={() => deleteSubItem(subItem.id)}
                        className="edit-rubric-btn delete-subitem-btn"
                      >Delete Sub-Criterion</button>
                    </li>)}
                </ul>
                <div className="subitem-button-group">
                  <button
                    onClick={() => addSubItem(category.id)}
                    className="edit-rubric-btn add-subitem-btn"
                  >Add Sub-Criterion</button>
                  <button
                    onClick={() => deleteCriterion(category.id)}
                    className="edit-rubric-btn"
                  >Delete Criterion</button>
                </div>
              </td>
              {columns?.map((headerLevel) => {
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

                  <textarea
                    className="change-rubric-input"
                    value={matchingLevel?.description}
                    name={`${category.id}_${matchingLevel?.id}`}
                    onChange={(e) => changeDescription(e)}
                  />
                </td>;
                //   }
              })}
            </tr>)}
          <tr>
            <td>
              <button onClick={createNewCriterion} className="edit-rubric-btn">Add Criterion</button>
            </td>
          </tr>
        </tbody>
      </table>
    </DragDropContext>
  </div>;
};

export default EditRubric;
