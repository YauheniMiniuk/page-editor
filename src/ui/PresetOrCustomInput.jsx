// ui/PresetOrCustomInput.jsx
import React, { useState, useEffect } from 'react';
import styles from './PresetOrCustomInput.module.css';

// 1. Импортируем наши новые, разделенные компоненты
import PresetSelector from './PresetSelector';
import CustomUnitInput from './CustomUnitInput';

const PresetOrCustomInput = ({
  label,
  presets,
  units,
  value,
  onChange,
}) => {
  // 2. Внутреннее состояние теперь только одно — оно решает, что показывать.
  const [isCustom, setIsCustom] = useState(false);

  // 3. Этот эффект остаётся. Его задача — определить при первой загрузке,
  // является ли переданное значение `value` пресетом или нет.
  useEffect(() => {
    const isPresetValue = presets.some(p => p.value === value);
    // Если значение не из пресетов, включаем режим кастомного ввода
    setIsCustom(!isPresetValue);
  }, [value, presets]);

  // Кнопка-переключатель режимов
  const ModeToggleButton = () => (
    <button
      className={styles.linkButton}
      onClick={() => {
        // При переключении сбрасываем значение на первое из пресетов
        // или на стандартное кастомное значение
        const newValue = isCustom ? presets[0]?.value || '' : '16px';
        onChange(newValue);
        // Состояние isCustom обновится автоматически через useEffect
      }}
    >
      {isCustom ? 'Использовать пресеты' : 'Ввести свое значение'}
    </button>
  );

  return (
    <div className={styles.wrapper}>
      <div className={styles.labelWrapper}>
        <label className={styles.label}>{label}</label>
        <ModeToggleButton />
      </div>
      
      {isCustom ? (
        // 4. Если режим кастомный, рендерим CustomUnitInput
        <CustomUnitInput
          value={value}
          onChange={onChange}
          units={units}
        />
      ) : (
        // 5. Если режим пресетов, рендерим PresetSelector
        <PresetSelector
          options={presets}
          value={value}
          onChange={onChange}
        />
      )}
    </div>
  );
};

export default PresetOrCustomInput;