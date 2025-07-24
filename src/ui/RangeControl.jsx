import React from 'react';
import styles from './RangeControl.module.css';

const RangeControl = ({
    label,
    value,
    onChange, // Этот onChange теперь будет получать только число
    min = 0,
    max = 100,
    step = 1,
    helpText,
    className,
    ...rest
}) => {
    // 🔥 Внутренний обработчик, который работает с событием
    const handleChange = (e) => {
        // Преобразуем строковое значение из инпута в число
        const newValue = Number(e.target.value);
        // Вызываем внешний onChange, передавая ему уже чистое число
        onChange(newValue);
    };

    return (
        <div className={`${styles.wrapper} ${className || ''}`}>
            <div className={styles.labelWrapper}>
                <label className={styles.label}>{label}</label>
                <span className={styles.valueDisplay}>{value}</span>
            </div>
            <input
                type="range"
                value={value}
                onChange={handleChange} // <-- Используем наш внутренний обработчик
                min={min}
                max={max}
                step={step}
                className={styles.slider}
                {...rest}
            />
            {helpText && <p className={styles.helpText}>{helpText}</p>}
        </div>
    );
};

export default RangeControl;