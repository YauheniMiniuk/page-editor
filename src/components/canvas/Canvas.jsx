import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { AnimatePresence, motion } from 'framer-motion';
import styles from './Canvas.module.css';
import BlockRenderer from './BlockRenderer';
import useBlockManagement from '../../hooks/useBlockManagement';
import { useBlockManager } from '../../contexts/BlockManagementContext';

// 1. Canvas теперь просто принимает `mode` и наш единый `editorContext`
const Canvas = ({ mode, }) => {
  const isEditMode = mode === 'edit';

  // 2. Деструктурируем `blocks` и `actions` из контекста.
  // Отдельные функции нам больше не нужны.
  const { blocks, actions } = useBlockManager();

  const { isOver, setNodeRef } = useDroppable({
      id: 'canvas-root-dropzone',
      data: { targetId: 'root', position: 'inner', context: 'canvas' },
      disabled: !isEditMode,
    });

  // 3. Исправляем обработчик: теперь он вызывает метод из объекта `actions`.
  const handleCanvasClick = () => {
    if (isEditMode) {
      // Вызываем actions.select, передавая null, чтобы снять выделение.
      actions.select(null);
    }
  };

  // Проверка на то, что blocks - это массив (остается полезной)
  const isBlocksArray = Array.isArray(blocks);

  const motionProps = {
    layout: true,
    initial: { opacity: 0, y: -10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
    transition: { type: "spring", stiffness: 500, damping: 50 },
  };

  return (
    <div
      ref={setNodeRef}
      className={styles.canvas}
      onClick={handleCanvasClick}
    >
      <AnimatePresence>
        {isBlocksArray && blocks.length > 0 ? (
          blocks.map((block, index) => (
            <BlockRenderer
              key={block.id}
              mode={mode}
              block={block}
              isFirst={index === 0}
              isLast={index === blocks.length - 1}
              motionProps={motionProps}
            />
          ))
        ) : (
          isEditMode && (
            <div className={`${styles.emptyCanvasDropZone} ${isOver ? styles.canvasOver : ''}`}>
              {isOver ? "Отпускай!" : "Перетащи сюда первый элемент"}
            </div>
          )
        )}
        {!isBlocksArray && (
          <div style={{ color: 'red', textAlign: 'center', padding: '20px' }}>
            Ошибка: Данные блоков имеют неверный формат.
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Canvas;