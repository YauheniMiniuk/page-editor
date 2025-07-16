import React, { useState, useLayoutEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import styles from './BlockToolbar.module.css';
import { useBlockManager } from '../../contexts/BlockManagementContext';
import { findBlockAndParent } from '../../utils/blockUtils';
import DropdownMenu from '../../ui/DropdownMenu';
import ToolbarButton from '../../ui/ToolbarButton';
import { DragHandleIcon } from '../../utils/icons';
import ToolbarButtonGroup from '../../ui/ToolbarButtonGroup';

const TOOLBAR_MARGIN = 8; // Отступ от блока в пикселях
const portalRoot = document.getElementById('portal-root');

const BlockToolbar = ({ selectedBlock, targetRef, dragHandleListeners, children }) => {
  const toolbarRef = useRef(null);
  const [style, setStyle] = useState({ opacity: 0 }); // Начинаем с невидимого состояния

  const { blocks, actions, copiedStyles  } = useBlockManager();

  const blockInfo = findBlockAndParent(blocks, selectedBlock.id);
  const parent = blockInfo?.parent;
  const siblings = parent ? parent.children : blocks;
  const isFirst = blockInfo?.index === 0;
  const isLast = blockInfo?.index === siblings.length - 1;

  const menuItems = [
    {
      label: 'Дублировать',
      icon: '📄',
      onClick: () => actions.duplicate(selectedBlock.id),
    },
    {
      label: 'Копировать стили',
      icon: '🎨',
      onClick: () => actions.copyStyles(selectedBlock.id),
    },
    {
      label: 'Вставить стили',
      icon: '🖌️',
      onClick: () => actions.pasteStyles(selectedBlock.id),
      // Делаем пункт неактивным, если в "буфере обмена" пусто
      disabled: !copiedStyles,
    },
    { isSeparator: true }, // Убедись, что твой DropdownMenu это поддерживает
    {
      label: 'Удалить блок',
      icon: '🗑️',
      onClick: () => actions.delete(selectedBlock.id),
      isDestructive: true,
    },
  ];

  const handleSwapUp = () => actions.swap(selectedBlock.id, 'up');
  const handleSwapDown = () => actions.swap(selectedBlock.id, 'down');
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
    setTimeout(() => {
      calculatePosition();
    }, 150);

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
    blocks
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

      <ToolbarButtonGroup>
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
      </ToolbarButtonGroup>

      {React.Children.count(children) > 0 && (
        <div className={styles.toolbarSeparator} />
      )}

      {children}

      <div className={styles.toolbarSeparator} />

      <ToolbarButtonGroup>
        <DropdownMenu triggerContent="⋮" items={menuItems} />
      </ToolbarButtonGroup>
    </div>
  );

  return ReactDOM.createPortal(toolbarContent, portalRoot);
};

export default BlockToolbar;