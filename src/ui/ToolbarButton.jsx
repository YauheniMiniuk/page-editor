import React from 'react';
import styles from './ToolbarButton.module.css';

const ToolbarButton = ({ children, isActive = false, ...props }) => {
  // Собираем классы: основной и активный, если нужно
  const buttonClasses = `${styles.button} ${isActive ? styles.active : ''}`;

  return (
    <button className={buttonClasses} {...props}>
      {children}
    </button>
  );
};

export default ToolbarButton;