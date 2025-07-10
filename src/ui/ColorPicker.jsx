import React, { useState, useRef, useEffect } from 'react';
import { SketchPicker } from 'react-color'; // Возвращаем SketchPicker
import styles from './ColorPicker.module.css';

const ColorPicker = ({ label, value, onChange, presetColors = [] }) => {
  const [displayColorPicker, setDisplayColorPicker] = useState(false);
  const pickerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setDisplayColorPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // ВАЖНО: Эта функция теперь правильно обрабатывает прозрачность
  const handleColorChange = (color) => {
    // Получаем r, g, b и alpha (a) из объекта color
    const { r, g, b, a } = color.rgb;
    // Передаем в родительский компонент цвет в формате rgba
    onChange(`rgba(${r}, ${g}, ${b}, ${a})`);
  };

  const handleReset = () => {
    onChange(undefined);
    setDisplayColorPicker(false);
  };

  return (
    <div className={styles.wrapper}>
      {label && <label className={styles.label}>{label}</label>}
      <div className={styles.controls}>
        {/* Контейнер с "шахматкой", который показывает цвет */}
        <div className={styles.swatch} onClick={() => setDisplayColorPicker(true)}>
          <div className={styles.color} style={{ background: value }} />
        </div>

        {/* Кнопка сброса */}
        <button onClick={handleReset} className={styles.resetButton} title="Сбросить цвет">
          ✕
        </button>

        {/* Всплывающее окно с палитрой */}
        {displayColorPicker && (
          <div className={styles.popover} ref={pickerRef}>
            <SketchPicker
              color={value || '#fff'}
              onChangeComplete={handleColorChange}
              presetColors={[]}
            />
          </div>
        )}
      </div>

      {/* Предустановленные цвета */}
      {presetColors.length > 0 && (
        <div className={styles.presets}>
          {presetColors.map((color) => (
            <div
              key={color}
              className={styles.presetSwatch}
              style={{ background: color }}
              onClick={() => onChange(color)}
              title={color}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ColorPicker;