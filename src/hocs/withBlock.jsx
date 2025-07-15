import React, { useRef } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import classNames from 'classnames';
import { motion } from 'framer-motion'; // <-- Импортируем motion
import BlockToolbar from '../components/common/BlockToolbar';
import { getVariantClasses } from '../utils/styleUtils';
import styles from './withBlock.module.css';
import { useBlockManager } from '../contexts/BlockManagementContext';

export const withBlock = (BlockComponent) => {
    const MotionBlockComponent = motion(BlockComponent);
    const WrappedComponent = React.forwardRef((props, ref) => {
        // --- Получаем всё из одного места ---
        const { block, mode, blockNodesRef, layoutDirection } = props;
        const { actions, isInlineEditing, activeId, selectedBlockId } = useBlockManager();

        // --- Вычисляем состояния прямо здесь ---
        const isSelected = selectedBlockId === block.id;
        const isEditMode = mode === 'edit';

        const { blockInfo, blockStyles } = BlockComponent;
        const { isContainer, getToolbarItems } = blockInfo;
        const blockRef = useRef(null);
        const isDragging = activeId === block.id;
        const isEmpty = isContainer && (!block.children || block.children.length === 0);

        const { attributes, listeners, setNodeRef: setDraggableNodeRef } = useDraggable({
            id: block.id,
            data: { block, isContainer },
            disabled: !isEditMode || isInlineEditing,
        });

        const { setNodeRef: setDroppableNodeRef } = useDroppable({
            id: block.id,
            data: { block, isContainer, isEmpty, layoutDirection: layoutDirection || 'column' },
        });

        const mergeRefs = (node) => {
            setDraggableNodeRef(node);
            setDroppableNodeRef(node);
            blockRef.current = node;

            if (blockNodesRef?.current) {
                if (node) blockNodesRef.current.set(block.id, node);
                else blockNodesRef.current.delete(block.id);
            }
            if (typeof ref === 'function') ref(node);
            else if (ref) ref.current = node;
        };

        // --- Обработчик теперь использует actions напрямую ---
        const handleBlockClick = (e) => {
            e.stopPropagation();
            actions.select(block.id);
        };

        const finalClassName = classNames(
            getVariantClasses(block.variants, blockStyles),
            {
                [styles.selected]: isSelected && isEditMode,
                [styles.isDragging]: isDragging,
            }
        );

        const finalStyle = {
            opacity: isDragging ? 0.4 : 1,
            pointerEvents: isDragging ? 'none' : 'auto',
        };

        const toolbarContent = getToolbarItems?.({ block, actions }) || null;

        return (
            <>
                {isEditMode && isSelected && (
                    <BlockToolbar targetRef={blockRef} selectedBlock={block} dragHandleListeners={listeners}>
                        {toolbarContent}
                    </BlockToolbar>
                )}

                {/* --- ИЗМЕНЕНИЕ 3: Используем MotionBlockComponent и передаем ему motion-пропсы --- */}
                <MotionBlockComponent
                    {...props}
                    actions={actions}
                    ref={mergeRefs}
                    isSelected={isSelected}
                    className={finalClassName}
                    style={{ ...props.style, ...finalStyle }}

                    // DnD атрибуты
                    {...attributes}
                    {...listeners}

                    // Motion пропсы
                    layout="position"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}

                    // Остальные пропсы
                    onClick={mode === 'edit' ? handleBlockClick : undefined}
                    data-block-id={block.id}
                />
            </>
        );
    });

    WrappedComponent.displayName = `withBlock(${BlockComponent.displayName || BlockComponent.name || 'Component'})`;
    WrappedComponent.blockInfo = BlockComponent.blockInfo;
    WrappedComponent.blockStyles = BlockComponent.blockStyles;

    return WrappedComponent;
};