import React from 'react';
import styles from './ToolbarButton.module.css';

const ToolbarButton = ({ children, isActive = false, ...props }) => {
  const className = [
    styles.button,
    isActive ? styles.active : '',
    props.disabled ? styles.disabled : '',
  ].join(' ').trim();

  return (
    <button className={className} {...props}>
      {children}
    </button>
  );
};

export default ToolbarButton;
