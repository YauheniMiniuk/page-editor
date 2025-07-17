import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import styles from './DraggableSidebarItem.module.css';

const DraggableSidebarItem = ({ type, label, icon }) => {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: `sidebar-${type}`,
    data: { type, isNew: true, context: 'sidebar' },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={styles.sidebarItem}
    >
      {icon && <div className={styles.iconWrapper}>{icon}</div>}
      <span className={styles.label}>{label}</span>
    </div>
  );
};

export default DraggableSidebarItem;