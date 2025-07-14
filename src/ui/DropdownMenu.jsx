import React, { useState, useRef, useEffect } from 'react';
import styles from './DropdownMenu.module.css';

const DropdownMenu = ({ items, triggerContent = '⋮' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleItemClick = (onClick) => {
    onClick?.();
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className={styles.wrapper}>
      <button
        className={styles.dropdownButton}
        title="Дополнительные опции"
        onClick={() => setIsOpen(!isOpen)}
      >
        {triggerContent}
      </button>

      {isOpen && (
        <div className={styles.menu}>
          {items.map((item, index) => (
            <button
              key={item.label || index}
              className={`${styles.menuItem} ${item.isDestructive ? styles.destructive : ''}`}
              onClick={() => handleItemClick(item.onClick)}
            >
              {item.icon && <span className={styles.icon}>{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default DropdownMenu;
