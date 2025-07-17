import React from 'react';
// 1. Импортируем стили из панели
import styles from './ElementsAndPatternsPanel.module.css';
import DraggableSidebarItem from './DraggableSidebarItem';
import { AVAILABLE_BLOCKS } from '../../utils/constants';

const SidebarElements = () => {
  return (
    // 2. Применяем общий класс и устанавливаем переменную для ширины блоков
    <div 
      className={styles.inserterGrid} 
      style={{ '--grid-item-min-width': '80px' }}
    >
      {AVAILABLE_BLOCKS.map(block => (
        <DraggableSidebarItem
          key={block.type}
          type={block.type}
          label={block.label}
          icon={block.icon}
        />
      ))}
    </div>
  );
};

export default SidebarElements;