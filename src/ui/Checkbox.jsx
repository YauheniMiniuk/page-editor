import React from 'react';
import styles from './Checkbox.module.css'; // Подключаем стили

/**
 * Простой UI компонент Checkbox
 * @param {object} props - Пропсы
 * @param {string} props.label - Текст метки рядом с чекбоксом
 * @param {boolean} props.checked - Текущее состояние чекбокса (включен/выключен)
 * @param {function} props.onChange - Функция обратного вызова при изменении состояния
 */
const Checkbox = ({ label, checked, onChange }) => {
  return (
    // Используем label как обертку, чтобы клик по тексту также активировал чекбокс
    <label className={styles.wrapper}>
      <input
        type="checkbox"
        className={styles.input} // Скрываем стандартный чекбокс
        checked={checked}
        onChange={onChange}
      />
      {/* Это наш кастомный, стилизованный чекбокс */}
      <span className={styles.customCheckbox}></span>
      {/* Текст метки */}
      <span className={styles.label}>{label}</span>
    </label>
  );
};

export default Checkbox;
