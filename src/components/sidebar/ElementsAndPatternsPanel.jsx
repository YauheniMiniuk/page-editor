import React, { useState } from 'react';
import SidebarElements from './SidebarElements';
import DraggablePatternItem from './DraggablePatternItem';
import styles from './ElementsAndPatternsPanel.module.css';

const ElementsAndPatternsPanel = ({ patterns, onDeletePattern }) => {
    const [activeTab, setActiveTab] = useState('elements');

    return (
        // Добавляем обертку с flex-direction: column
        <div className={styles.wrapper}>
            <div className={styles.tabs}>
                <button onClick={() => setActiveTab('elements')} className={activeTab === 'elements' ? styles.activeTab : ''}>
                    Блоки
                </button>
                <button onClick={() => setActiveTab('patterns')} className={activeTab === 'patterns' ? styles.activeTab : ''}>
                    Паттерны
                </button>
            </div>
            <div className={styles.content}>
                {activeTab === 'elements' && <SidebarElements />}
                {activeTab === 'patterns' && (
                    <div
                        className={styles.inserterGrid}
                        style={{ '--grid-item-min-width': '120px' }}
                    >
                        {(patterns || []).map(pattern => (
                            <DraggablePatternItem
                                key={pattern.id}
                                pattern={pattern}
                                onDeletePattern={onDeletePattern}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ElementsAndPatternsPanel;