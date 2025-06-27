import React from 'react';
import styles from './Select.module.css';

const Select = ({ label, value, onChange, options }) => (
  <div className={styles.wrapper}>
    <label className={styles.label}>{label}</label>
    <select value={value} onChange={(e) => onChange(e.target.value)} className={styles.select}>
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </div>
);

export default Select;
