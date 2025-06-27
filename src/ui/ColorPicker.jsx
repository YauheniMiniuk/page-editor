import React from 'react';
import styles from './ColorPicker.module.css';

const ColorPicker = ({ label, value, onChange }) => (
  <div className={styles.wrapper}>
    <label className={styles.label}>{label}</label>
    <input
      type="color"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={styles.input}
    />
  </div>
);

export default ColorPicker;
