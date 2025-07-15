// src/components/panels/StructurePanel.jsx
import React, { useState } from 'react';
import styles from './StructurePanel.module.css';
import StructureItem from './StructureItem';
import { useBlockManager } from '../../contexts/BlockManagementContext';
import { useDroppable } from '@dnd-kit/core';

// Принимаем новые пропсы
const StructurePanel = ({ structureNodesRef, dropIndicator }) => {
  const { blocks, actions, selectedBlockId } = useBlockManager();
  const [expandedIds, setExpandedIds] = useState({});

  const { setNodeRef: rootDropRef } = useDroppable({
    id: 'structure-root', // Уникальный ID для корневой зоны
    data: { context: 'structure-root' }
  });

  const handleToggleExpand = (blockId) => {
    setExpandedIds(prev => ({ ...prev, [blockId]: !prev[blockId] }));
  };

  const handleSelect = (blockId) => {
    actions.select(blockId);
  };

  // Инициализируем expandedIds, чтобы все контейнеры были раскрыты по умолчанию
  useState(() => {
    const initialExpanded = {};
    const traverseAndExpand = (blocksToScan) => {
      blocksToScan.forEach(block => {
        if (block.children && block.children.length > 0) {
          initialExpanded[block.id] = true;
          traverseAndExpand(block.children);
        }
      });
    };
    traverseAndExpand(blocks);
    setExpandedIds(initialExpanded);
  }, [blocks]);


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
          />
        ))}
      </ul>
    </div>
  );
};

export default StructurePanel;