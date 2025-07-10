import React, { useState, useEffect } from 'react';
import styles from './CustomUnitInput.module.css';
import Input from './Input';
import Select from './Select';

const CustomUnitInput = ({
  label,
  value, // "16px", "2rem" и т.д.
  onChange,
  units = ['px', 'rem', 'em', '%'],
}) => {
  const [number, setNumber] = useState('');
  const [unit, setUnit] = useState(units[0]);

  // Этот эффект парсит входящее значение (например, "16px")
  // и обновляет внутреннее состояние компонента.
  useEffect(() => {
    const stringValue = String(value || '');
    const match = stringValue.match(/(-?\d+\.?\d*)\s*(\w+|%)/);
    if (match) {
      setNumber(match[1]);
      setUnit(match[2]);
    } else {
      setNumber(stringValue);
      // Если единица не найдена, ставим по умолчанию
      if (!units.includes(unit)) {
        setUnit(units[0]);
      }
    }
  }, [value]); // Зависимость только от внешнего value

  // Вызываем внешний onChange при любом изменении
  const triggerChange = (newNumber, newUnit) => {
    if (newNumber === '' || newNumber === null) {
      onChange(''); // Если поле пустое, отправляем пустую строку
    } else {
      onChange(`${newNumber}${newUnit}`);
    }
  };

  const handleNumberChange = (e) => {
    const newNumber = e.target.value;
    setNumber(newNumber);
    triggerChange(newNumber, unit);
  };

  const handleUnitChange = (newUnit) => {
    setUnit(newUnit);
    triggerChange(number, newUnit);
  };

  return (
    <>
      {label}
      <div className={styles.customInputWrapper}>
        <Input
          type="number"
          value={number}
          onChange={handleNumberChange}
        />
        <Select
          value={unit}
          onChange={handleUnitChange}
          options={units.map(u => ({ value: u, label: u }))}
        />
      </div>
    </>

  );
};

export default CustomUnitInput;