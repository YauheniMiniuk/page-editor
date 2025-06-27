import React from 'react';
import styles from './Input.module.css';

const Input = ({ label, value, onChange, placeholder }) => (
  <div className={styles.wrapper}>
    <label className={styles.label}>{label}</label>
    <input
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={styles.input}
    />
  </div>
);

export default Input;
