// src/components/common/DragOverlayContent.jsx
import React from 'react';
import styles from './DragOverlayContent.module.css';
import { BLOCK_TYPES } from '../../utils/constants'; // Добавим импорт BLOCK_TYPES

const DragOverlayContent = ({ block }) => {
  return (
    <div className={styles.dragOverlayItem}>
      {block.type === BLOCK_TYPES.TEXT ? (
        <span>{block.content || 'Текст'}</span>
      ) : (
        <span>{block.type}</span>
      )}
    </div>
  );
};

export default DragOverlayContent;