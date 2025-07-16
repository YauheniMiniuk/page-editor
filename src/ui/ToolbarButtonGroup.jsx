import React from 'react';
import styles from './ToolbarButtonGroup.module.css';

const ToolbarButtonGroup = ({ children }) => (
  <div className={styles.group}>
    {children}
  </div>
);

export default ToolbarButtonGroup;
