import React, { useState, useRef, useEffect } from 'react';
import styles from './ToolbarSelect.module.css';

const ToolbarSelect = ({ options, value, onChange, title }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);
  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className={styles.wrapper} title={title}>
      <button className={styles.trigger} onClick={() => setIsOpen(!isOpen)} aria-expanded={isOpen}>
        {selectedOption?.label || value}
        <span className={styles.arrow}>▾</span>
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          {options.map(option => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                className={`${styles.option} ${isSelected ? styles.selected : ''}`}
                onClick={() => handleSelect(option.value)}
              >
                {option.label}
                {/* 👇 Добавили галочку для выбранного элемента */}
                {isSelected && <span className={styles.checkIcon}>✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ToolbarSelect;