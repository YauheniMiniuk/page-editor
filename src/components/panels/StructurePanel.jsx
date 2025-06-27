import React from 'react';
import styles from './StructurePanel.module.css';

const StructurePanel = ({ blocks, onSelect, selectedId }) => {
  const renderStructure = (blockList) => (
    <ul className={styles.structureUl}>
      {blockList.map(block => (
        <li key={block.id}>
          <div onClick={() => onSelect(block.id)} className={`${styles.structureLi} ${block.id === selectedId ? styles.structureLiSelected : ''}`}>
            {block.type}
          </div>
          {block.children?.length > 0 && <div className={styles.structureChildrenContainer}>{renderStructure(block.children)}</div>}
        </li>
      ))}
    </ul>
  );
  return <div className={styles.structurePanel}><h3>Структура</h3>{renderStructure(blocks)}</div>;
};

export default StructurePanel;