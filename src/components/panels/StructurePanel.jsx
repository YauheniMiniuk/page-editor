// src/components/panels/StructurePanel.jsx
import React, { useState, useEffect } from 'react';
import styles from './StructurePanel.module.css';
import StructureItem from './StructureItem';
import { useBlockManager } from '../../contexts/BlockManagementContext';
import { useDroppable } from '@dnd-kit/core';
import { findBlockPath } from '../../utils/blockUtils'; // 1. Импортируем твою функцию

const StructurePanel = ({ structureNodesRef, dropIndicator, onSaveAsPattern }) => {
  const { blocks, actions, selectedBlockId, selectedBlock, copiedStyles } = useBlockManager();
  const [expandedIds, setExpandedIds] = useState({});

  const { setNodeRef: rootDropRef } = useDroppable({
    id: 'structure-root',
    data: { context: 'structure-root' }
  });

  const handleToggleExpand = (blockId) => {
    setExpandedIds(prev => ({ ...prev, [blockId]: !prev[blockId] }));
  };

  const handleSelect = (blockId) => {
    actions.select(blockId);
  };

  // 2. 🔥 ОБНОВЛЕННАЯ ЛОГИКА СУЩЕСТВУЮЩЕЙ ФУНКЦИЕЙ
  useEffect(() => {
    if (selectedBlockId) {
      // Находим путь в виде массива объектов блоков
      const pathObjects = findBlockPath(blocks, selectedBlockId);

      if (pathObjects) {
        // Преобразуем массив объектов в массив ID и убираем ID самого элемента
        const parentIds = pathObjects.map(block => block.id).slice(0, -1);

        setExpandedIds(prevExpanded => {
          const newExpanded = { ...prevExpanded };
          parentIds.forEach(id => {
            newExpanded[id] = true;
          });
          return newExpanded;
        });
      }
    }
  }, [selectedBlockId, blocks]);

  return (
    <div className={styles.structurePanel} ref={rootDropRef}>
      <h3>Структура</h3>
      <ul className={styles.structureUl}>
        {blocks.map(block => (
          <StructureItem
            key={block.id}
            block={block}
            level={0}
            onSelect={handleSelect}
            selectedId={selectedBlockId}
            expandedIds={expandedIds}
            onToggleExpand={handleToggleExpand}
            actions={actions}
            structureNodesRef={structureNodesRef}
            dropIndicator={dropIndicator}
            onSaveAsPattern={onSaveAsPattern}
          />
        ))}
      </ul>
    </div>
  );
};

export default StructurePanel;