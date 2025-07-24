import React from 'react';
import styles from './IconButton.module.css';

const IconButton = ({ className, style, onClick, children, tooltip }) => {
    // Атрибут data-tooltip будет использоваться для позиционирования в CSS
    return (
        <button
            className={`${styles.iconButton} ${className || ''}`}
            style={style}
            onClick={onClick}
            data-tooltip={tooltip}
        >
            {children}
        </button>
    );
};

export default IconButton;