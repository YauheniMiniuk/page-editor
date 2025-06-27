import React from 'react';
import { useDroppable } from '@dnd-kit/core';
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

  // 4. УДАЛЯЕМ ручное создание объекта `editorProps`. Он больше не нужен!
  // Вся необходимая информация уже есть в `editorContext`.

  return (
    <div
      ref={setNodeRef}
      className={styles.canvas}
      onClick={handleCanvasClick}
    >
      {isBlocksArray && blocks.length > 0 ? (
        blocks.map((block, index) => (
          <BlockRenderer
            key={block.id}
            mode={mode}
            block={block}
            isFirst={index === 0}
            isLast={index === blocks.length - 1}
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
    </div>
  );
};

export default Canvas;