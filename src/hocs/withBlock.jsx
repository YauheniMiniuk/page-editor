import React, { useRef } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import classNames from 'classnames';
import BlockToolbar from '../components/common/BlockToolbar';
import { getVariantClasses } from '../utils/styleUtils';
import styles from './withBlock.module.css';
import { useBlockManager } from '../contexts/BlockManagementContext';

export const withBlock = (BlockComponent) => {
    const WrappedComponent = React.forwardRef((props, ref) => {
        const { block, mode, isSelected, onSelect, activeId, blockNodesRef, layoutDirection } = props;
        const { actions, isInlineEditing } = useBlockManager();
        const { blockInfo, blockStyles } = BlockComponent;
        const { isContainer, getToolbarItems } = blockInfo;
        const blockRef = useRef(null);

        const isEditMode = mode === 'edit';
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
            // Устанавливаем ref'ы для dnd-kit
            setDraggableNodeRef(node);
            setDroppableNodeRef(node);

            // 🔥 ФИКС ТУЛБАРА: Присваиваем DOM-узел нашему внутреннему ref'у
            blockRef.current = node;

            // Обновляем общую карту узлов
            if (blockNodesRef?.current) {
                if (node) {
                    blockNodesRef.current.set(block.id, node);
                } else {
                    blockNodesRef.current.delete(block.id);
                }
            }

            // Пробрасываем ref выше, если он есть
            if (typeof ref === 'function') {
                ref(node);
            } else if (ref) {
                ref.current = node;
            }
        };

        const handleBlockClick = (e) => {
            e.stopPropagation();
            onSelect();
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
                <BlockComponent
                    {...props}
                    ref={mergeRefs}
                    className={finalClassName}
                    style={{ ...props.style, ...finalStyle }}
                    {...attributes}
                    {...listeners}
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