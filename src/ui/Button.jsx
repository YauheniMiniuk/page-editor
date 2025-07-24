import React, { forwardRef } from 'react';
import classNames from 'classnames';
import styles from './Button.module.css';

const Button = forwardRef(({
    children,
    onClick,
    type = 'button',
    disabled = false,
    primary = false,
    danger = false,
    small = false,
    className,
    ...rest
}, ref) => {

    const finalClasses = classNames(
        styles.button,
        {
            [styles.primary]: primary,
            [styles.danger]: danger,
            [styles.small]: small,
        },
        className // Для добавления внешних классов
    );

    return (
        <button
            ref={ref}
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={finalClasses}
            {...rest}
        >
            {children}
        </button>
    );
});

export default Button;