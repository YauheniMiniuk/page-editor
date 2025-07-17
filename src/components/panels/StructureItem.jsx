import React, { useRef, useEffect, useState } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import classNames from 'classnames';
import styles from './StructurePanel.module.css';
import { BLOCK_COMPONENTS } from '../../utils/constants';
import DropdownMenu from '../../ui/DropdownMenu';
import { useBlockManager } from '../../contexts/BlockManagementContext';
import { CopyStylesIcon, DuplicateIcon, PasteStylesIcon, SaveIcon } from '../../utils/icons';
import { TrashIcon } from 'lucide-react';

const StructureItem = ({
    block,
    level,
    onSelect,
    selectedId,
    onToggleExpand,
    expandedIds,
    structureNodesRef,
    dropIndicator,
    onSaveAsPattern,
}) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const { actions, copiedStyles } = useBlockManager();

    const { id, type, children } = block;
    const isExpanded = !!expandedIds[id];
    const hasChildren = children?.length > 0;
    const { blockInfo } = BLOCK_COMPONENTS[type] || {};
    const canHaveChildren = !!blockInfo?.isContainer;

    // --- Регистрируем DOM-узел ---
    const nodeRef = useRef(null);
    useEffect(() => {
        if (nodeRef.current) {
            structureNodesRef.current.set(id, nodeRef.current);
        }
        return () => {
            structureNodesRef.current.delete(id);
        };
    }, [id, structureNodesRef]);

    const structureId = `structure-${id}`;

    // --- Логика Draggable ---
    const { attributes, listeners, setNodeRef: draggableRef, isDragging } = useDraggable({
        id: structureId, // Используем чистый ID блока
        data: { blockId: id, block, context: 'structure' },
    });

    // --- Логика Droppable (ОДИН на весь элемент) ---
    const { setNodeRef: droppableRef } = useDroppable({
        id: structureId,
        data: { blockId: id, block, context: 'structure' },
    });

    // --- Объединяем ref'ы ---
    const setCombinedRef = (node) => {
        nodeRef.current = node;
        draggableRef(node);
        droppableRef(node);
    };

    // --- Стилизация на основе dropIndicator ---
    const isTarget = dropIndicator?.targetId === id;
    const wrapperClasses = classNames(styles.itemWrapper, {
        [styles.dropTargetBefore]: isTarget && dropIndicator.position === 'top',
        [styles.dropTargetAfter]: isTarget && dropIndicator.position === 'bottom',
        [styles.dragging]: isDragging,
        [styles.isSelectedWrapper]: id === selectedId,
    });

    const itemClasses = classNames(styles.structureItem, {
        [styles.itemSelected]: id === selectedId,
        [styles.innerDropHighlight]: dropIndicator?.targetId === id && dropIndicator.position === 'inner',
    });

    const menuItems = [
        {
            label: 'Дублировать',
            icon: <DuplicateIcon />,
            onClick: () => actions.duplicate(id),
        },
        {
            label: 'Копировать стили',
            icon: <CopyStylesIcon />,
            onClick: () => actions.copyStyles(id),
        },
        {
            label: 'Вставить стили',
            icon: <PasteStylesIcon />,
            onClick: () => actions.pasteStyles(id),
            disabled: !copiedStyles,
        },
        { isSeparator: true },
        { label: 'Сохранить как паттерн', icon: <SaveIcon />, onClick: onSaveAsPattern },
        { isSeparator: true },
        {
            label: 'Удалить блок',
            icon: <TrashIcon />,
            onClick: () => actions.delete(id),
            isDestructive: true,
        },
    ];

    return (
        <li
            ref={setCombinedRef}
            className={wrapperClasses}
            style={{ '--indent-size': `${level * 20}px`, opacity: isDragging ? 0.4 : 1 }}
        >
            <div className={itemClasses}>
                <div className={styles.itemContent} onClick={() => onSelect(id)}>
                    {canHaveChildren && (
                        <button
                            className={styles.toggleButton}
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleExpand(id);
                            }}
                        >
                            {hasChildren ? (isExpanded ? '▼' : '►') : <span style={{ display: 'inline-block', width: '1em' }}></span>}
                        </button>
                    )}
                    <span className={styles.itemIcon}>{blockInfo?.icon || '❓'}</span>
                    <span className={styles.itemLabel}>{blockInfo?.label || type}</span>
                </div>
                <div className={styles.itemActions} onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu
                        items={menuItems}
                        triggerContent="⋮"
                        onOpenChange={setIsMenuOpen}
                    />
                    <div className={styles.dragHandle} {...attributes} {...listeners}>
                        ⠿
                    </div>
                </div>
            </div>

            {canHaveChildren && isExpanded && (
                <ul className={`${styles.structureUl} ${styles.childrenList}`}>
                    {children.map((child) => (
                        <StructureItem
                            key={child.id}
                            block={child}
                            level={level + 1}
                            actions={actions}
                            onSelect={onSelect}
                            selectedId={selectedId}
                            expandedIds={expandedIds}
                            onToggleExpand={onToggleExpand}
                            structureNodesRef={structureNodesRef} // Прокидываем дальше
                            dropIndicator={dropIndicator}       // Прокидываем дальше
                        />
                    ))}
                </ul>
            )}
        </li>
    );
};

export default StructureItem;