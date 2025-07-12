import React, { useRef } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import classNames from 'classnames';
import BlockToolbar from '../components/common/BlockToolbar';
import { getVariantClasses } from '../utils/styleUtils';
import styles from './withBlock.module.css';
import { useBlockManager } from '../contexts/BlockManagementContext';

export const withBlock = (BlockComponent) => {
    const WrappedComponent = React.forwardRef((props, ref) => {
        const { block, mode, isSelected, onSelect, activeId } = props;
        const { actions, isInlineEditing } = useBlockManager();
        const { blockInfo, blockStyles } = BlockComponent;
        const { isContainer, getToolbarItems } = blockInfo;

        const blockRef = useRef(null);
        const isEditMode = mode === 'edit';
        const isCurrentBlockDragging = activeId === block.id;

        const { attributes, listeners, setNodeRef: setDraggableNodeRef } = useDraggable({
            id: block.id,
            data: { block, isContainer },
            disabled: !isEditMode || isInlineEditing,
        });

        const { setNodeRef: setDroppableNodeRef } = useDroppable({
            id: block.id,
            data: { isContainer, parentDirection: props.parentDirection || 'column' },
        });

        const mergeRefs = (node) => {
            setDraggableNodeRef(node);
            setDroppableNodeRef(node);
            blockRef.current = node;
            if (typeof ref === 'function') ref(node);
            else if (ref) ref.current = node;
        };

        const handleBlockClick = (e) => {
            e.stopPropagation();
            onSelect();
        };

        const finalClassName = classNames(
            getVariantClasses(block.variants, blockStyles),
            {
                [styles.selected]: isSelected && isEditMode,
                [styles.isDragging]: isCurrentBlockDragging,
            }
        );

        const finalStyle = {
            opacity: isCurrentBlockDragging ? 0.5 : 1,
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
                    style={finalStyle}
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