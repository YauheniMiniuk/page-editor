// components/panels/PropertiesPanel.jsx

import React from 'react';
import styles from './PropertiesPanel.module.css';
import { BLOCK_COMPONENTS } from '../../utils/constants';
import { useBlockManager } from '../../contexts/BlockManagementContext';

const PropertiesPanel = ({ selectedBlock }) => {
  const { actions } = useBlockManager();

  if (!selectedBlock) {
    return (
      <div className={styles.panel}>
        <div className={styles.placeholder}>
          <p>Выберите блок, чтобы изменить его свойства.</p>
        </div>
      </div>
    );
  }

  const BlockComponent = BLOCK_COMPONENTS[selectedBlock?.type];
  const blockInfo = BlockComponent?.blockInfo;
  
  // --- 1. СОЗДАЕМ ПОМОЩНИКОВ ---
  const currentVariants = selectedBlock.variants || {};

  const updateVariant = (variantName, newValue) => {
    actions.update(selectedBlock.id, {
      variants: { ...currentVariants, [variantName]: newValue },
    });
  };

  // Этот помощник будет генерировать пропсы для кнопок варианта
  const getVariantButtonProps = (variantName, optionValue) => {
    const isActive = (currentVariants[variantName] || blockInfo.supportedVariants[variantName]?.defaultValue) === optionValue;
    return {
      onClick: () => updateVariant(variantName, optionValue),
      className: isActive ? styles.active : '',
    };
  };
  
  // Этот помощник будет генерировать пропсы для селектов варианта
  const getVariantSelectProps = (variantName) => {
    return {
        value: currentVariants[variantName] || blockInfo.supportedVariants[variantName]?.defaultValue,
        onChange: (newValue) => updateVariant(variantName, newValue)
    };
  };

  const helpers = {
    getVariantButtonProps,
    getVariantSelectProps,
    updateVariant,
  };

  // --- 2. ВЫЗЫВАЕМ getEditor С НОВЫМ АРГУМЕНТОМ ---
  const handleChange = (newProps) => {
    actions.update(selectedBlock.id, newProps);
  };
  
  const editorUI = blockInfo?.getEditor?.(
    { block: selectedBlock, onChange: handleChange }, // Первый аргумент - данные
    helpers // Второй аргумент - наши помощники
  );

  return (
    <div className={styles.panel}>
      <h3>Настройки блока</h3>
      {editorUI || <p>Для этого блока нет настроек.</p>}
    </div>
  );
};

export default PropertiesPanel;