import React, { useRef } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import styles from './BlockRenderer.module.css';
import { BLOCK_TYPES, BLOCK_COMPONENTS } from '../../utils/constants';
import BlockToolbar from '../common/BlockToolbar';
import { findBlockAndParent } from '../../utils/blockUtils';
import useBlockManagement from '../../hooks/useBlockManagement';
import { useBlockManager } from '../../contexts/BlockManagementContext';

const BlockRenderer = ({ block, mode, parentDirection = 'column' }) => {
  const blockRef = useRef(null);
  const isEditMode = mode === 'edit';
  const {
    selectedBlockId,
    activeId,
    blocks,
    actions
  } = useBlockManager();

  const isDragging = activeId !== null;


  const { attributes, listeners, setNodeRef: setDraggableNodeRef, transform } = useDraggable({
    id: block.id,
    data: { block, isCanvasItem: true },
    disabled: !isEditMode,
  });

  const { setNodeRef: dropTop, isOver: overTop } = useDroppable({
    id: `${block.id}-top`,
    data: { targetId: block.id, position: 'top' },
    disabled: !isEditMode,
  });
  const { setNodeRef: dropBottom, isOver: overBottom } = useDroppable({
    id: `${block.id}-bottom`,
    data: { targetId: block.id, position: 'bottom' },
    disabled: !isEditMode,
  });
  // Новые зоны для горизонтального режима
  const { setNodeRef: dropLeft, isOver: overLeft } = useDroppable({
    id: `${block.id}-left`,
    data: { targetId: block.id, position: 'left' },
    disabled: !isEditMode,
  });
  const { setNodeRef: dropRight, isOver: overRight } = useDroppable({
    id: `${block.id}-right`,
    data: { targetId: block.id, position: 'right' },
    disabled: !isEditMode,
  });

  const { setNodeRef: dropInner, isOver: isOverInner } = useDroppable({
    id: `${block.id}-inner`,
    data: { targetId: block.id, position: 'inner' },
    disabled: !isEditMode || block.type !== BLOCK_TYPES.CONTAINER,
  });

  const wrapperClasses = [
    styles.blockWrapper,
    isEditMode && selectedBlockId === block.id ? styles.selectedWrapper : '',
    isDragging ? styles.dragging : ''
  ].filter(Boolean).join(' ');

  const style = {
    // ...(block.styles || {}),
    transform: isEditMode && transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isEditMode && activeId === block.id ? 0.5 : 1,
  };

  const ComponentToRender = BLOCK_COMPONENTS[block.type];

  const getToolbarContent = () => {
    // Эта функция будет вызываться только в режиме редактирования, поэтому проверки на isEditMode не нужны.
    const blockSpecificItems = ComponentToRender?.getToolbarItems?.({
      block,
      actions,
    }) || [];

    const blockInfo = findBlockAndParent(blocks, block.id);
    const siblings = blockInfo?.parent ? blockInfo.parent.children : blocks;
    const isFirst = blockInfo?.index === 0;
    const isLast = blockInfo?.index === siblings.length - 1;

    const baseItems = (
      <>
        {blockInfo?.parent && (
          <button title="Выбрать родителя" onClick={() => actions.selectParent(block.id)}>↑</button>
        )}
        {!isFirst && (
          <button title="Предыдущий элемент" onClick={() => actions.selectSibling(block.id, 'prev')}>←</button>
        )}
        {!isLast && (
          <button title="Следующий элемент" onClick={() => actions.selectSibling(block.id, 'next')}>→</button>
        )}
      </>
    );

    return (
      <>
        {baseItems}
        {blockSpecificItems.length > 0 && <div className={styles.toolbarSeparator}></div>}
        {blockSpecificItems}
      </>
    );
  };

  if (!ComponentToRender) {
    return <div>Неизвестный тип блока: {block.type}</div>;
  }

  const handleWrapperClick = (e) => {
    if (isEditMode) {
      e.stopPropagation();
      actions.select(block.id);
    }
  };

  const renderedChildren = block.children?.map((childBlock) => (
    // FIX: Больше не передаем isFirst и isLast
    <BlockRenderer
      key={childBlock.id}
      block={childBlock}
      mode={mode}
      parentDirection={block.props?.direction || 'column'}
    />
  ));

  return (
    <div
      ref={setDraggableNodeRef}
      className={wrapperClasses}
      style={style}
      {...(isEditMode ? attributes : {})}
      {...(isEditMode ? listeners : {})}
      onClick={handleWrapperClick}
    >
      {/* --- Внешние Drop-зоны (теперь абсолютно позиционированы) --- */}
      {isEditMode && (
        <>
          {parentDirection === 'column' ? (
            <>
              <div ref={dropTop} className={`${styles.dropZone} ${styles.dropZoneTop} ${overTop ? styles.dropZoneOver : ''}`} />
              <div ref={dropBottom} className={`${styles.dropZone} ${styles.dropZoneBottom} ${overBottom ? styles.dropZoneOver : ''}`} />
            </>
          ) : (
            <>
              <div ref={dropLeft} className={`${styles.dropZone} ${styles.dropZoneLeft} ${overLeft ? styles.dropZoneOver : ''}`} />
              <div ref={dropRight} className={`${styles.dropZone} ${styles.dropZoneRight} ${overRight ? styles.dropZoneOver : ''}`} />
            </>
          )}
        </>
      )}

      {/* --- Тулбар и кнопка удаления --- */}
      {isEditMode && selectedBlockId === block.id && (
        <>
          <BlockToolbar targetRef={blockRef}>{getToolbarContent()}</BlockToolbar>
          <button className={styles.deleteButton} onClick={(e) => { e.stopPropagation(); actions.delete(block.id); }}>X</button>
        </>
      )}

      <ComponentToRender
        ref={blockRef}
        block={block}
        actions={actions}
        mode={mode}
        dropRef={isEditMode && block.type === BLOCK_TYPES.CONTAINER ? dropInner : null}
        isOver={isEditMode && block.type === BLOCK_TYPES.CONTAINER ? isOverInner : false}
      >
        {renderedChildren}
      </ComponentToRender>
    </div>
  );
};

export default BlockRenderer;