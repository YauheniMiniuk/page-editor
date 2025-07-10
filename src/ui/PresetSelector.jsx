import React from 'react';
import styles from './PresetSelector.module.css';
import ToolbarButton from './ToolbarButton';

const PresetSelector = ({
  options, // [{ value: 'normal', label: 'M' }, ...]
  value,
  onChange
}) => {
  return (
    <div className={styles.presetGroup}>
      {options.map(opt => (
        <ToolbarButton
          key={opt.value}
          title={opt.label}
          isActive={value === opt.value}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </ToolbarButton>
      ))}
    </div>
  );
};

export default PresetSelector;