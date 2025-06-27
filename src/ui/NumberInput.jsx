import React from 'react';
import styles from './NumberInput.module.css';

const NumberInput = ({ value, onChange, min, max }) => (
  <input
    className={styles.numberInput}
    type="number"
    value={value}
    min={min}
    max={max}
    onChange={e => onChange(Number(e.target.value))}
  />
);

export default NumberInput;
