import React from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import styles from './StructurePanel.module.css';
import { BLOCK_COMPONENTS } from '../../utils/constants'; // Нам нужны иконки и лейблы
import DropdownMenu from '../../ui/DropdownMenu';
import { useBlockManager } from '../../contexts/BlockManagementContext';

const StructureItem = ({
    block,
    level,
    expandedIds,
    onSelect,
    selectedId,
    onToggleExpand,
    actions
}) => {

    const { overDropZone, activeDragItem } = useBlockManager();
    const { id, type, children } = block;
    const isExpanded = !!expandedIds[block.id];
    const hasChildren = children?.length > 0;
    const canHaveChildren = !!BLOCK_COMPONENTS[type]?.blockInfo?.isContainer;

    const overId = overDropZone?.id;
    const isDropTargetBefore = overId === `structure-${id}-top`;
    const isDropTargetAfter = overId === `structure-${id}-bottom`;
    const isDropTargetInner = overId === `structure-${id}-inner`;

    const wrapperClasses = [
        styles.itemWrapper,
        isDropTargetBefore ? styles.dropTargetBefore : '',
        isDropTargetAfter ? styles.dropTargetAfter : '',
    ].filter(Boolean).join(' ');

    const itemClasses = [
        styles.structureItem,
        id === selectedId ? styles.itemSelected : '',
        isDropTargetInner ? styles.innerDropHighlight : '',
    ].filter(Boolean).join(' ');

    // Получаем иконку и лейбл из нашего конфига блоков
    const blockInfo = BLOCK_COMPONENTS[type]?.blockInfo || { icon: '❓', label: type };

    const { attributes, listeners, setNodeRef: draggableRef } = useDraggable({
        id: `structure-${id}`,
        data: { block, isStructureItem: true, context: 'structure' },
    });

    const { setNodeRef: dropTopRef } = useDroppable({
        id: `structure-${id}-top`,
        data: { targetId: id, position: 'top', context: 'structure' }
    });
    const { setNodeRef: dropBottomRef } = useDroppable({
        id: `structure-${id}-bottom`,
        data: { targetId: id, position: 'bottom', context: 'structure' }
    });
    const { setNodeRef: dropInnerRef } = useDroppable({
        id: `structure-${id}-inner`,
        data: { targetId: id, position: 'inner', context: 'structure' },
        disabled: !canHaveChildren,
    });

    const menuItems = [
        { label: 'Удалить блок', icon: '🗑️', onClick: () => actions.delete(id), isDestructive: true },
        // Сюда можно добавить "Дублировать" и т.д.
    ];

    return (
        <li className={wrapperClasses} style={{ '--indent-size': `${level * 20}px` }}>
            <div ref={dropTopRef} className={styles.dropZoneTop} />
            <div ref={draggableRef} className={itemClasses}>
                <div className={styles.itemContent} style={{ paddingLeft: 'var(--indent-size)' }} onClick={() => onSelect(id)}>
                    {canHaveChildren && (
                        <button className={styles.toggleButton} onClick={(e) => { e.stopPropagation(); onToggleExpand(id); }}>
                            {isExpanded ? '▼' : '►'}
                        </button>
                    )}
                    <span className={styles.itemIcon}>{blockInfo.icon}</span>
                    <span className={styles.itemLabel}>{blockInfo.label}</span>
                </div>
                <div className={styles.itemActions} onClick={e => e.stopPropagation()}>
                    <DropdownMenu items={menuItems} triggerContent="⋮" />
                    <div className={styles.dragHandle} {...attributes} {...listeners}>⠿</div>
                </div>
            </div>
            <div ref={dropBottomRef} className={styles.dropZoneBottom} />

            {canHaveChildren && isExpanded && (
                <ul ref={dropInnerRef} className={`${styles.structureUl} ${styles.childrenList}`}>
                    {hasChildren && children.map(child => (
                        <StructureItem
                            key={child.id}
                            block={child}
                            level={level + 1}
                            actions={actions}
                            onSelect={onSelect}
                            selectedId={selectedId}
                            expandedIds={expandedIds}
                            onToggleExpand={onToggleExpand}
                            activeDragItem={activeDragItem}
                            overDropZone={overDropZone}
                        />
                    ))}
                </ul>
            )}
        </li>
    );
};

export default StructureItem;
