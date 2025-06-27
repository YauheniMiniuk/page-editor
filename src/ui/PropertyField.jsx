import React from 'react';
import styles from './PropertyField.module.css';

const PropertyField = ({ label, children }) => (
  <div className={styles.propertyField}>
    <label className={styles.label}>{label}</label>
    {children}
  </div>
);

export default PropertyField;
