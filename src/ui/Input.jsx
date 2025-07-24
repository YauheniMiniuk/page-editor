import React from 'react';
import styles from './Input.module.css';

const Input = ({ label, value, onChange, name, type = 'text', placeholder, className, helpText, ...rest }) => {
    const id = `input-${name}`;

    return (
        <div className={`${styles.wrapper} ${className || ''}`}>
            {label && <label htmlFor={id} className={styles.label}>{label}</label>}
            <input
                id={id}
                type={type}
                name={name} // <-- Вот оно!
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className={styles.input}
                {...rest} // <-- И это важно для передачи disabled, required и т.д.
            />
            {helpText && <p className={styles.helpText}>{helpText}</p>}
        </div>
    );
};

export default Input;