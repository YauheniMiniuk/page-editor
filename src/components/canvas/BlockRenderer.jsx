import React, { useEffect, useRef, useState } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { motion } from 'framer-motion';
import styles from './BlockRenderer.module.css';
import { BLOCK_TYPES, BLOCK_COMPONENTS } from '../../utils/constants';
import BlockToolbar from '../common/BlockToolbar';
import { findBlockAndParent } from '../../utils/blockUtils';
import useBlockManagement from '../../hooks/useBlockManagement';
import { useBlockManager } from '../../contexts/BlockManagementContext';

const BlockRenderer = ({ block, mode, isFirst, isLast, motionProps }) => {
  const blockRef = useRef(null);
  const isEditMode = mode === 'edit';
  const {
    selectedBlockId,
    activeId,
    blocks,
    actions
  } = useBlockManager();
  const [isEditingText, setIsEditingText] = useState(false);

  const isDragging = activeId !== null;
  const ComponentToRender = BLOCK_COMPONENTS[block.type];
  const isContainer = !!ComponentToRender?.blockInfo?.isContainer;
  const isSelected = isEditMode && selectedBlockId === block.id;

  const { attributes, listeners, setNodeRef: setDraggableNodeRef } = useDraggable({
    id: block.id,
    data: { block, isCanvasItem: true, context: 'canvas' },
    disabled: !isEditMode || isEditingText,
  });

  const { setNodeRef: dropTop, isOver: overTop } = useDroppable({
    id: `${block.id}-top`,
    data: { targetId: block.id, position: 'top', context: 'canvas' },
    disabled: !isEditMode,
  });
  const { setNodeRef: dropBottom, isOver: overBottom } = useDroppable({
    id: `${block.id}-bottom`,
    data: { targetId: block.id, position: 'bottom', context: 'canvas' },
    disabled: !isEditMode,
  });
  const { setNodeRef: dropLeft, isOver: overLeft } = useDroppable({
    id: `${block.id}-left`,
    data: { targetId: block.id, position: 'left', context: 'canvas' },
    disabled: !isEditMode,
  });
  const { setNodeRef: dropRight, isOver: overRight } = useDroppable({
    id: `${block.id}-right`,
    data: { targetId: block.id, position: 'right', context: 'canvas' },
    disabled: !isEditMode,
  });

  const { setNodeRef: dropInner, isOver: isOverInner } = useDroppable({
    id: `${block.id}-inner`,
    data: { targetId: block.id, position: 'inner', context: 'canvas' },
    disabled: !isEditMode || !isContainer,
  });

  const mergeRefs = (node) => {
    setDraggableNodeRef(node); // для перетаскивания
    blockRef.current = node;   // для тулбара
  };

  const enterTextEditMode = () => {
    if (isEditMode && block.type === 'core/text') {
      setIsEditingText(true);
      // Просто ставим фокус. Браузер сам поставит курсор в место клика.
      blockRef.current?.focus();
    }
  };

  const handleFocusOut = () => {
    setIsEditingText(false);
  };

  const handleDoubleClick = () => {
    enterTextEditMode();
  };

  const wrapperClasses = [
    styles.blockWrapper,
    selectedBlockId === block.id && isEditMode ? styles.selectedWrapper : '',
  ].filter(Boolean).join(' ');

  const style = {
    opacity: activeId === block.id ? 0.5 : 1,
  };

  const getToolbarContent = () => {
    return ComponentToRender?.blockInfo?.getToolbarItems?.({
      block,
      actions,
    }) || null;
  };

  if (!ComponentToRender) {
    return <div>Неизвестный тип блока: {block.type}</div>;
  }

  if (block.isPreview) {
    return <div className={styles.previewPlaceholder} />;
  }

  const handleWrapperClick = (e) => {
    if (isEditMode) {
      e.stopPropagation();

      // Если кликнули по уже выделенному текстовому блоку - входим в режим редактирования
      if (block.id === selectedBlockId && block.type === 'core/text') {
        enterTextEditMode();
        return; // Прерываем выполнение, чтобы не вызывать select еще раз
      }

      // В противном случае - просто выделяем блок
      if (block.id !== selectedBlockId) {
        actions.select(block.id);
      }
    }
  };

  const renderedChildren = block.children?.map((childBlock, index) => {
    return (
      <BlockRenderer
        key={childBlock.id}
        block={childBlock}
        mode={mode}
        isFirst={index === 0}
        isLast={index === block.children.length - 1}
        motionProps={motionProps}
      />
    );
  });



  return (
    <>
      {isEditMode && isSelected && (
        <BlockToolbar targetRef={blockRef} selectedBlock={block} dragHandleListeners={listeners}>{getToolbarContent()}</BlockToolbar>
      )}
      <div className={styles.shellWrapper}>
        {isEditMode && isDragging && activeId !== block.id && (
          <>
            {isFirst && <div ref={dropTop} className={`${styles.dropZone} ${styles.dropZoneTop} ${overTop ? styles.dropZoneOver : ''}`} />}
            <div ref={dropBottom} className={`${styles.dropZone} ${styles.dropZoneBottom} ${overBottom ? styles.dropZoneOver : ''}`} />
          </>
        )}
        <ComponentToRender
          ref={mergeRefs}
          block={block}
          mode={mode}
          className={wrapperClasses}
          actions={actions}
          isOver={isOverInner}
          isEditingText={isEditingText}
          dropRef={dropInner}
          onClick={handleWrapperClick}
          onDoubleClick={handleDoubleClick}
          onFocusOut={handleFocusOut}
          {...attributes}
          {...listeners}
        >
          {renderedChildren}
        </ComponentToRender>
      </div>
    </>

  );
};

export default BlockRenderer;