import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import styles from './DraggablePatternItem.module.css';
import { MoreHorizontal, Trash2 } from 'lucide-react';
import Dropdown from '../../ui/Dropdown';
import { TrashIcon } from '../../utils/icons';

const DraggablePatternItem = ({ pattern, onDeletePattern }) => {
    const { id, name, previewImage, content } = pattern;

    const { attributes, listeners, setNodeRef } = useDraggable({
        id: `pattern-${id}`,
        data: {
            isNew: true,
            isPattern: true,
            content: content,
            context: 'sidebar'
        },
    });

    const handleDelete = () => {
        if (onDeletePattern) onDeletePattern(id);
    };

    // Этот div нужен, чтобы dnd-kit не перехватывал клик по кнопке меню
    const handleWrapperClick = (e) => e.stopPropagation();

    return (
        <div ref={setNodeRef} className={styles.patternItem} title={name}>
            <div {...listeners} {...attributes} style={{ cursor: 'grab' }}>
                <img src={previewImage} alt={name} className={styles.previewImage} />
            </div>

            <div className={styles.footer}>
                <span className={styles.patternName}>{name}</span>

                <div onClick={handleWrapperClick}>
                    <Dropdown
                        // --- ИЗМЕНЕНИЕ №1: Передаем кнопку как проп `trigger` ---
                        trigger={
                            <button className={styles.menuButton}>
                                <MoreHorizontal size={16} />
                            </button>
                        }
                    >
                        {/* --- ИЗМЕНЕНИЕ №2: Передаем кнопку "Удалить" как children --- */}
                        <button onClick={handleDelete} className={styles.destructiveButton}>
                            <TrashIcon size={14} />
                            <span>Удалить</span>
                        </button>
                    </Dropdown>
                </div>
            </div>
        </div>
    );
};

export default DraggablePatternItem;