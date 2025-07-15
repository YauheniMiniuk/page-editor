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
      isDestructive: true,
    },
  ];

  const handleSwapUp = () => actions.swapBlock(selectedBlock.id, 'up');
  const handleSwapDown = () => actions.swapBlock(selectedBlock.id, 'down');
  const handleSelectParent = () => actions.select(parent.id);

  useLayoutEffect(() => {
    // Выносим узлы в переменные для чистоты
    const targetNode = targetRef.current;
    const toolbarNode = toolbarRef.current;

    // Если одного из узлов нет, просто ничего не делаем и скрываем тулбар
    if (!targetNode || !toolbarNode) {
      setStyle({ opacity: 0 });
      return;
    }

    const calculatePosition = () => {
      const targetRect = targetNode.getBoundingClientRect();
      const toolbarHeight = toolbarNode.offsetHeight;
      let topPosition;

      // Твоя логика позиционирования остается без изменений
      const isBlockScrolledPast = targetRect.top < TOOLBAR_MARGIN;
      if (isBlockScrolledPast) {
        topPosition = TOOLBAR_MARGIN;
      } else {
        const topPositionAbove = targetRect.top - toolbarHeight - TOOLBAR_MARGIN;
        topPosition = (topPositionAbove > 0)
          ? topPositionAbove
          : targetRect.bottom + TOOLBAR_MARGIN;
      }

      const leftPosition = targetRect.left + targetRect.width / 2;

      setStyle({
        position: 'fixed',
        top: `${topPosition}px`,
        left: `${leftPosition}px`,
        transform: 'translateX(-50%)',
        opacity: 1,
      });
    };

    // Вычисляем позицию при первом рендере и при смене зависимостей
    calculatePosition();

    // Добавляем слушатели для "живого" следования
    window.addEventListener('scroll', calculatePosition, true);
    window.addEventListener('resize', calculatePosition);

    // Функция очистки
    return () => {
      window.removeEventListener('scroll', calculatePosition, true);
      window.removeEventListener('resize', calculatePosition);
    };
  }, [
    targetRef.current,    // <-- ГЛАВНЫЙ ФИКС: теперь эффект перезапустится, когда узел появится
    selectedBlock.id,     // Пересчитываем позицию при выборе нового блока
  ]);

  const toolbarContent = (
    <div
      ref={toolbarRef}
      className={styles.toolbar}
      style={style}
      // onMouseDown={(e) => {
      //   e.stopPropagation();
      //   e.preventDefault();
      // }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Ручка для перетаскивания. dnd-kit сам правильно обработает ее события. */}
      <div className={styles.dragHandle} {...dragHandleListeners}>
        <DragHandleIcon />
      </div>

      {/* Эти кнопки уже "умные" и сами останавливают всплытие */}
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

      {/* Оставляем обработчик только на группе с выпадающим меню */}
      <div className={styles.toolbarButtonGroup}>
        <DropdownMenu triggerContent="⋮" items={menuItems} />
      </div>
    </div>
  );

  return ReactDOM.createPortal(toolbarContent, portalRoot);
};

export default BlockToolbar;