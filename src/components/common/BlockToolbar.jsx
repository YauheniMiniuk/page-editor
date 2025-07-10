import React, { useState, useLayoutEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import styles from './BlockToolbar.module.css';
import { useBlockManager } from '../../contexts/BlockManagementContext';
import { findBlockAndParent } from '../../utils/blockUtils';
import DropdownMenu from '../../ui/DropdownMenu';
import ToolbarButton from '../../ui/ToolbarButton';
import { DragHandleIcon } from '../../utils/icons';

const TOOLBAR_MARGIN = 8; // Отступ от блока в пикселях
const portalRoot = document.getElementById('portal-root');

const BlockToolbar = ({ selectedBlock, targetRef, dragHandleListeners, children }) => {
  const toolbarRef = useRef(null);
  const [style, setStyle] = useState({ opacity: 0 }); // Начинаем с невидимого состояния

  const { blocks, actions } = useBlockManager();

  const blockInfo = findBlockAndParent(blocks, selectedBlock.id);
  const parent = blockInfo?.parent;
  const siblings = parent ? parent.children : blocks;
  const isFirst = blockInfo?.index === 0;
  const isLast = blockInfo?.index === siblings.length - 1;

  const menuItems = [
    {
      label: 'Удалить блок',
      icon: '🗑️',
      onClick: () => actions.delete(selectedBlock.id),
      isDestructive: true, // Добавим флаг для стилизации
    },
    // Сюда в будущем можно добавить "Дублировать", "Копировать стили" и т.д.
  ];

  const handleSwapUp = () => actions.swapBlock(selectedBlock.id, 'up');
  const handleSwapDown = () => actions.swapBlock(selectedBlock.id, 'down');
  const handleSelectParent = () => actions.select(parent.id);
  const handleToolbarClick = (e) => e.stopPropagation();

  useLayoutEffect(() => {
    if (!targetRef.current) return;

    const calculatePosition = () => {
      if (!targetRef.current || !toolbarRef.current) return;

      const targetRect = targetRef.current.getBoundingClientRect();
      const toolbarHeight = toolbarRef.current.offsetHeight;
      let topPosition;
      const position = 'fixed';

      const isBlockScrolledPast = targetRect.top < TOOLBAR_MARGIN;
      if (isBlockScrolledPast) {
        topPosition = TOOLBAR_MARGIN;
      } else {
        const topPositionAbove = targetRect.top - toolbarHeight - TOOLBAR_MARGIN;
        if (topPositionAbove > 0) {
          topPosition = topPositionAbove;
        } else {
          topPosition = targetRect.bottom + TOOLBAR_MARGIN;
        }
      }

      const leftPosition = targetRect.left + targetRect.width / 2;

      setStyle({
        position,
        top: `${topPosition}px`,
        left: `${leftPosition}px`,
        transform: 'translateX(-50%)',
        opacity: 1,
      });
    };

    calculatePosition();
    // Возвращаем слушатель скролла для "живого" следования
    window.addEventListener('scroll', calculatePosition, true);
    window.addEventListener('resize', calculatePosition);

    return () => {
      window.removeEventListener('scroll', calculatePosition, true);
      window.removeEventListener('resize', calculatePosition);
    };
  }, [targetRef, selectedBlock.id, blockInfo?.index]);

  const toolbarContent = (
    <div ref={toolbarRef} className={styles.toolbar} style={style} onClick={handleToolbarClick} onMouseDown={handleToolbarClick}>
      <div className={styles.dragHandle} {...dragHandleListeners}>
        <DragHandleIcon />
      </div>
      <div className={styles.toolbarButtonGroup}>
        <ToolbarButton title="Переместить вверх" onClick={handleSwapUp} disabled={isFirst}>
          ↑
        </ToolbarButton>
        <ToolbarButton title="Переместить вниз" onClick={handleSwapDown} disabled={isLast}>
          ↓
        </ToolbarButton>
        {parent && (
          <ToolbarButton title="Выбрать родителя" onClick={handleSelectParent}>
            ⤴
          </ToolbarButton>
        )}
      </div>
      {React.Children.count(children) > 0 && (
        <div className={styles.toolbarSeparator} />
      )}
      {children}
      <div className={styles.toolbarSeparator} />
      <div className={styles.toolbarButtonGroup}>
        <DropdownMenu triggerContent="⋮" items={menuItems} />
      </div>
    </div>
  );

  return ReactDOM.createPortal(toolbarContent, portalRoot);
};

export default BlockToolbar;