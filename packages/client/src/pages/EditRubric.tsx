/* eslint-disable no-console */
import React, { CSSProperties, useEffect, useState } from 'react';
import {
  DragDropContext,
  Draggable,
  Droppable,
  DropResult,
} from '@hello-pangea/dnd';
import {
  FaGripVertical,
  FaPlus,
  FaPlusCircle,
  FaTrash,
} from 'react-icons/fa';
import { type RubricCategory, RubricPerformanceLevel } from './PastEvaluations';
import '../CSS/EditRubric.css';

const IconButton: React.FC<{
  className?: string;
  icon: React.ReactElement;
  onClick: (e: React.MouseEvent) => void;
  tooltip: string;
}> = ({ className = ``, icon, onClick, tooltip }) =>
  <button
    type="button"
    onClick={onClick}
    className={`icon-btn ${className}`}
  >
    {icon}
    <span className="tooltip">{tooltip}</span>
  </button>;
const EditRubric: React.FC = () => {
  const [ rubricCategories, setRubricCategories ] = useState<RubricCategory[]>([]);
  const [ columns, setColumns ] = useState<RubricPerformanceLevel[]>([]);

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
    if (rubricCategories.length > 0) {
      setColumns([ ...rubricCategories[0].levels ]);
    }
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
      await fetch(`http://localhost:3001/changeRubric`, {
        body: JSON.stringify({ categoryId, description: value, levelId }),
        credentials: `include`,
        headers: { "Content-Type": `application/json` },
        method: `POST`,
      });
    } catch (err) {
      console.error(err);
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
      await fetch(`http://localhost:3001/changeRubric`, {
        body: JSON.stringify({ level: value, prevLevel: name }),
        credentials: `include`,
        headers: { "Content-Type": `application/json` },
        method: `POST`,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const changeSubItem = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const [ subItem, category ] = name.split(`_`);
    const categoryId = parseInt(category, 10);
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
      await fetch(`http://localhost:3001/changeRubric`, {
        body: JSON.stringify({ subItem: value, subItemId }),
        credentials: `include`,
        headers: { "Content-Type": `application/json` },
        method: `POST`,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const createNewLevel = async () => {
    try {
      await fetch(`http://localhost:3001/changeRubric`, {
        body: JSON.stringify({ addLevel: true }),
        credentials: `include`,
        headers: { "Content-Type": `application/json` },
        method: `POST`,
      });
      await fetchRubricCategories();
    } catch (err) {
      console.error(err);
    }
  };

  const changeCategory = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const categoryId = parseInt(name);
    setRubricCategories((prev) => prev.map((c) => {
      if (c.id !== categoryId) {
        return c;
      }
      return { ...c, name: value, title: value };
    }));
    try {
      await fetch(`http://localhost:3001/changeRubric`, {
        body: JSON.stringify({ categoryId, categoryTitle: value }),
        credentials: `include`,
        headers: { "Content-Type": `application/json` },
        method: `POST`,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const deleteLevel = async (levelId: number) => {
    try {
      await fetch(`http://localhost:3001/changeRubric`, {
        body: JSON.stringify({ deletedLevel: levelId }),
        credentials: `include`,
        headers: { "Content-Type": `application/json` },
        method: `POST`,
      });
      await fetchRubricCategories();
    } catch (err) {
      console.error(err);
    }
  };

  const createNewCriterion = async () => {
    try {
      await fetch(`http://localhost:3001/changeRubric`, {
        body: JSON.stringify({ addCategory: true }),
        credentials: `include`,
        headers: { "Content-Type": `application/json` },
        method: `POST`,
      });
      await fetchRubricCategories();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteCriterion = async (criterionId: number) => {
    try {
      await fetch(`http://localhost:3001/changeRubric`, {
        body: JSON.stringify({ deletedCategory: criterionId }),
        credentials: `include`,
        headers: { "Content-Type": `application/json` },
        method: `POST`,
      });
      await fetchRubricCategories();
    } catch (err) {
      console.error(err);
    }
  };

  const addSubItem = async (categoryId: number) => {
    try {
      await fetch(`http://localhost:3001/changeRubric`, {
        body: JSON.stringify({ addSubItem: true, categoryId }),
        credentials: `include`,
        headers: { "Content-Type": `application/json` },
        method: `POST`,
      });
      await fetchRubricCategories();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteSubItem = async (subItemId: number) => {
    try {
      await fetch(`http://localhost:3001/changeRubric`, {
        body: JSON.stringify({ deletedSubItem: subItemId }),
        credentials: `include`,
        headers: { "Content-Type": `application/json` },
        method: `POST`,
      });
      await fetchRubricCategories();
    } catch (err) {
      console.error(err);
    }
  };

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination || !columns) {
      return;
    }

    const updated = Array.from(columns);
    const [ moved ] = updated.splice(Number(result.source.index), 1);
    updated.splice(Number(result.destination.index), 0, moved);

    setColumns(updated);

    const reorderedLevelIds = updated.map((level) => level.id);
    try {
      await fetch(`http://localhost:3001/changeRubric`, {
        body: JSON.stringify({ reorderedLevelIds }),
        credentials: `include`,
        headers: { "Content-Type": `application/json` },
        method: `POST`,
      });
    } catch (err) {
      console.error(`Failed to update level order:`, err);
    }
  };

  const gridStyles: CSSProperties = {
    '--num-columns': columns?.length || 1,
  } as CSSProperties;

  return <div className="edit-rubric-container">
    <div className="edit-rubric-page">
      <header className="edit-rubric-header">
        <h1>Edit Rubric</h1>
        <button onClick={createNewLevel} className="btn btn-primary">
          <FaPlus />
          {` `}
          Add New Level
        </button>
      </header>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="rubric-grid" style={gridStyles}>
          <Droppable droppableId="columns" direction="horizontal">
            {(provided) =>
              <div className="rubric-headers" ref={provided.innerRef} {...provided.droppableProps}>
                <div className="header-criteria-title">Criteria</div>
                {columns?.map((level, index) =>
                  <Draggable key={level.id} draggableId={`${level.id}`} index={index}>
                    {(providedDrag) =>
                      <div className="level-header" ref={providedDrag.innerRef} {...providedDrag.draggableProps}>
                        <span className="drag-handle" {...providedDrag.dragHandleProps}>
                          <FaGripVertical />
                        </span>
                        <input
                          className="input-level-title input-base"
                          value={level.level}
                          name={`${level.level}`}
                          onChange={changeLevel}
                          aria-label="Level name"
                        />
                        <IconButton
                          icon={<FaTrash />}
                          onClick={() => deleteLevel(level.id)}
                          tooltip="Delete Level"
                          className="icon-btn-danger"
                        />
                      </div>}
                  </Draggable>)}
                {provided.placeholder}
              </div>}
          </Droppable>

          {rubricCategories.map((category) =>
            <div key={category.id} className="criterion-row" style={gridStyles}>
              <div className="criterion-content">
                <div className="criterion-title-header">
                  <input
                    className="input-criterion-title"
                    value={category.title}
                    name={`${category.id}`}
                    onChange={changeCategory}
                    aria-label="Criterion title"
                  />
                  <IconButton
                    icon={<FaTrash />}
                    onClick={() => deleteCriterion(category.id)}
                    tooltip="Delete Criterion"
                    className="icon-btn-danger"
                  />
                </div>

                <ul className="subitems-list">
                  {category.subItems?.map((subItem) =>
                    <li key={subItem.id} className="subitem">
                      <input
                        className="input-subitem"
                        value={subItem.name}
                        name={`${subItem.id}_${category.id}`}
                        onChange={changeSubItem}
                        aria-label="Sub-criterion name"
                      />
                      <IconButton
                        icon={<FaTrash />}
                        onClick={() => deleteSubItem(subItem.id)}
                        tooltip="Delete Sub-Criterion"
                        className="icon-btn-danger"
                      />
                    </li>)}
                </ul>

                <div className="criterion-actions">
                  <button onClick={() => addSubItem(category.id)} className="btn btn-secondary">
                    <FaPlusCircle />
                    {` `}
                    Add Sub-Criterion
                  </button>
                </div>
              </div>

              {columns?.map((headerLevel) => {
                const matchingLevel = category.levels.find((l) => l.level === headerLevel.level);
                return <div key={headerLevel.id} className="description-cell">
                  <textarea
                    className="textarea-description input-base"
                    value={matchingLevel?.description || ``}
                    name={`${category.id}_${matchingLevel?.id}`}
                    onChange={changeDescription}
                    placeholder="Enter description..."
                    aria-label={`Description for ${category.title} at ${headerLevel.level} level`}
                  />
                </div>;
              })}
            </div>)}
        </div>
      </DragDropContext>

      <div className="rubric-footer-actions">
        <button onClick={createNewCriterion} className="btn btn-primary">
          <FaPlus />
          {` `}
          Add New Criterion
        </button>
      </div>
    </div>
  </div>;
};

export default EditRubric;
