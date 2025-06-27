// src/components/sidebar/DraggableSidebarItem.jsx
import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import styles from './DraggableSidebarItem.module.css'; // Его собственные стили

const DraggableSidebarItem = ({ type, label, icon }) => {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: `sidebar-${type}`,
    data: { type, isSidebarItem: true },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={styles.sidebarItem}
    >
      {/* Теперь можешь смело добавлять иконку, если она есть */}
      {icon && <img src={icon} alt={label} className={styles.sidebarItemIcon} />}
      {label}
    </div>
  );
};

export default DraggableSidebarItem;