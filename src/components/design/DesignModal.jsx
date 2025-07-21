// src/components/design/DesignModal.js

import React from 'react';
import ReactDOM from 'react-dom';
import styles from './DesignModal.module.css'; // Используем свои стили
import Tabs from '../../ui/Tabs';
import Tab from '../../ui/Tab';
import FontManager from './FontManager';
import ThemeManager from './ThemeManager';

const DesignModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <header className={styles.header}>
                    <h2>Дизайн-система</h2>
                    <button onClick={onClose} className={styles.closeButton}>×</button>
                </header>
                <main className={styles.content}>
                    <Tabs>
                        <Tab title="Темы">
                            <ThemeManager />
                        </Tab>
                        <Tab title="Шрифты">
                            <FontManager />
                        </Tab>
                    </Tabs>
                </main>
                {/* Добавляем подвал для консистентности */}
                <footer className={styles.footer}>
                    <button onClick={onClose} className={styles.button}>
                        Закрыть
                    </button>
                </footer>
            </div>
        </div>,
        document.getElementById('portal-root')
    );
};

export default DesignModal;