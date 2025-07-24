import React from 'react';
import styles from './Textarea.module.css'; // Будут использоваться общие стили с Input

const Textarea = ({
    label,
    name,
    value,
    onChange,
    placeholder,
    rows = 4,
    helpText,
    className,
    ...rest
}) => {
    const id = `textarea-${name}`;

    return (
        <div className={`${styles.wrapper} ${className || ''}`}>
            {label && <label htmlFor={id} className={styles.label}>{label}</label>}
            <textarea
                id={id}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                rows={rows}
                className={styles.textarea}
                {...rest}
            />
            {helpText && <p className={styles.helpText}>{helpText}</p>}
        </div>
    );
};

export default Textarea;