import React from 'react';
import styles from './PresetSelector.module.css';
import ToolbarButton from './ToolbarButton';

const PresetSelector = ({
  label, // <-- Новый проп для заголовка
  options,
  value,
  onChange
}) => {
  return (
    <div className={styles.wrapper}>
      {label && <label className={styles.label}>{label}</label>}
      <div className={styles.presetGroup}>
        {options.map(opt => (
          <ToolbarButton
            key={opt.value}
            title={opt.label}
            isActive={value === opt.value}
            onClick={() => onChange(opt.value)}
          >
            {/* Показываем иконку, если она есть, иначе - текст */}
            {opt.icon || opt.label}
          </ToolbarButton>
        ))}
      </div>
    </div>
  );
};

export default PresetSelector;