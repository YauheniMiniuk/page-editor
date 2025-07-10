import React from 'react';
import styles from './DragOverlayContent.module.css';
import { BLOCK_COMPONENTS } from '../../utils/constants'; // Импортируем наш конфиг блоков

const DragOverlayContent = ({ block }) => {
  // Находим информацию о блоке (иконку, лейбл) по его типу
  const blockInfo = BLOCK_COMPONENTS[block?.blockInfo?.type]?.blockInfo || { icon: '❓', label: block?.blockInfo?.type };

  return (
    <div className={styles.dragOverlay}>
      <span className={styles.icon}>{blockInfo.icon}</span>
      <span className={styles.label}>{blockInfo.label}</span>
    </div>
  );
};

export default DragOverlayContent;