// src/components/panels/StructurePanel.jsx
import React, { useState } from 'react';
import styles from './StructurePanel.module.css';
import StructureItem from './StructureItem';
import { useBlockManager } from '../../contexts/BlockManagementContext';

const StructurePanel = () => {
  const { blocks, actions, selectedBlockId } = useBlockManager();
  const [expandedIds, setExpandedIds] = useState({});

  const handleToggleExpand = (blockId) => {
    setExpandedIds(prev => ({
      ...prev,
      [blockId]: !prev[blockId]
    }));
  };
  
  const handleSelect = (blockId) => {
    actions.select(blockId);
  };

  return (
    <div className={styles.structurePanel}>
      <h3>Структура</h3>
      <ul className={styles.structureUl}>
        {blocks.map(block => (
          <StructureItem
            key={block.id}
            block={block}
            level={0}
            expandedIds={expandedIds}
            onSelect={handleSelect}
            selectedId={selectedBlockId}
            isExpanded={!!expandedIds[block.id]}
            onToggleExpand={handleToggleExpand}
            actions={actions}
          />
        ))}
      </ul>
    </div>
  );
};

export default StructurePanel;