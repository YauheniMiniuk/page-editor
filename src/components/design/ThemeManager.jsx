// src/components/design/ThemeManager.js
import React, { useState, useEffect } from 'react';
import styles from './DesignModal.module.css';
import { useTheme } from '../../contexts/ThemeContext';

const ThemeManager = () => {
    const [themes, setThemes] = useState([]);
    const { applyTheme } = useTheme();

    const fetchThemes = async () => { /* ... */ };
    useEffect(() => { fetchThemes(); }, []);

    return (
        <div className={styles.managerSection}>
            <h4>Сохраненные темы</h4>
            <span>ждут своего часа:)</span>
            <ul className={styles.list}>
                {themes.map(theme => (
                    <li key={theme.id} className={styles.listItem}>
                        <span>{theme.name}</span>
                        <div className={styles.actions}>
                            <button onClick={() => applyTheme(theme.id)} className={styles.button}>Применить</button>
                            <button className={styles.buttonSecondary}>Редактировать</button>
                        </div>
                    </li>
                ))}
            </ul>
            {/* Здесь позже будет кнопка "Создать новую тему", которая откроет редактор тем */}
        </div>
    );
};

export default ThemeManager;