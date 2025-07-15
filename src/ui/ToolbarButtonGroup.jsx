import React from 'react';
import styles from './ToolbarButtonGroup.module.css';

const ToolbarButtonGroup = ({children}) => {
    return (
        <div className={styles.toolbarButtonGroup}>
            {children}
        </div>
    );
}

export default ToolbarButtonGroup;
