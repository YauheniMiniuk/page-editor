// src/components/sidebar/SidebarElements.jsx
import React from 'react';
import styles from './SidebarElements.module.css';
import { AVAILABLE_BLOCKS } from '../../utils/constants';
import DraggableSidebarItem from './DraggableSidebarItem'; // Импортируем новый/обновленный компонент

const SidebarElements = () => {
  return (
    <div className={styles.sidebarElements}>
      {AVAILABLE_BLOCKS.map(block => (
        <DraggableSidebarItem
          key={block.type} // Ключ по-прежнему уникален
          type={block.type}
          label={block.label}
          icon={block.icon} // Передаем иконку, если она есть
        />
      ))}
    </div>
  );
};

export default SidebarElements;