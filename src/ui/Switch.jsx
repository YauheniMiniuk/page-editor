import React from 'react';
import styles from './Switch.module.css';

const Switch = ({ checked, onChange }) => (
  <label className={styles.switch}>
    <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
    <span className={styles.slider}></span>
  </label>
);

export default Switch;
