import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './Dropdown.module.css';

const Dropdown = ({ trigger, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState({ opacity: 0 });
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const toggleDropdown = (e) => {
    e.stopPropagation();
    setIsOpen(prev => !prev);
  };

  useLayoutEffect(() => {
    if (isOpen && triggerRef.current && menuRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const menuRect = menuRef.current.getBoundingClientRect();

      let top = triggerRect.bottom + 8;
      let left = triggerRect.right - menuRect.width;

      // Проверяем, не выходит ли за левый край экрана
      if (left < 10) {
        left = 10;
      }
      
      // Проверяем, не выходит ли за нижний край экрана
      if (top + menuRect.height > window.innerHeight) {
        top = triggerRect.top - menuRect.height - 8;
      }

      setMenuStyle({
        position: 'fixed',
        top: `${top}px`,
        left: `${left}px`,
        opacity: 1,
        zIndex: 1000,
      });
    }

    if (!isOpen) {
      setMenuStyle({ opacity: 0, pointerEvents: 'none' });
    }
  }, [isOpen]);


  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target) &&
          triggerRef.current && !triggerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <>
      <div className={styles.trigger} onClick={toggleDropdown} ref={triggerRef}>
        {trigger}
      </div>
      {/* Используем портал, чтобы меню рендерилось в body и было над всеми элементами */}
      {createPortal(
        <div className={styles.menu} ref={menuRef} style={menuStyle}>
          {React.Children.map(children, child =>
            React.cloneElement(child, {
              onClick: (e) => {
                e.stopPropagation();
                if (child.props.onClick) child.props.onClick(e);
                setIsOpen(false);
              },
            })
          )}
        </div>,
        document.body
      )}
    </>
  );
};

export default Dropdown;