import React from 'react';
import styles from './PropertiesPanel.module.css';
import { BLOCK_COMPONENTS } from '../../utils/constants';
import useBlockManagement from '../../hooks/useBlockManagement';
import { useBlockManager } from '../../contexts/BlockManagementContext';

// Принимаем `selectedBlock` и `actions`
const PropertiesPanel = ({ selectedBlock }) => {

  const { actions } = useBlockManager();
  if (!selectedBlock) {
    return <div className={styles.propertiesPanel}>Выбери блок для редактирования</div>;
  }

  const BlockComponent = BLOCK_COMPONENTS[selectedBlock.type];

  if (!BlockComponent || typeof BlockComponent.getEditor !== 'function') {
    return (
      <div className={styles.propertiesPanel}>
        <h3>Свойства блока</h3>
        <p>Для этого блока нет настроек.</p>
      </div>
    );
  }

  // РЕШЕНИЕ: Создаем обработчик, который знает ID блока.
  // Он будет передаваться в getEditor как `onChange`.
  const handleChange = (newProps) => {
    // Вызываем actions.update с ДВУМЯ аргументами: ID и новые свойства.
    actions.update(selectedBlock.id, newProps);
  };

  // Вызываем getEditor, но вместо `actions` передаем ему простую функцию `onChange`.
  // Это упрощает API для самих блоков. Им не нужно думать про ID.
  const editorUI = BlockComponent.getEditor({
    block: selectedBlock,
    onChange: handleChange
  });

  return (
    <div className={styles.propertiesPanel}>
      <h3>Настройки блока</h3>
      {/* Просто рендерим JSX, который вернул блок */}
      {editorUI}
    </div>
  );
};

export default PropertiesPanel;