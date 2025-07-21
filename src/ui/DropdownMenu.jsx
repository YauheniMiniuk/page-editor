import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import classNames from 'classnames';
import styles from './DropdownMenu.module.css';

const DropdownMenu = ({ items, triggerContent = '⋮', isOpen, onToggle }) => {
    const [menuStyle, setMenuStyle] = useState({ opacity: 0 });
    const buttonRef = useRef(null);
    const menuRef = useRef(null);

    useLayoutEffect(() => {
        if (isOpen && buttonRef.current && menuRef.current) {
            const buttonRect = buttonRef.current.getBoundingClientRect();
            // Вычисляем позицию
            const top = buttonRect.bottom + 4;
            const left = buttonRect.right;

            setMenuStyle({
                position: 'fixed',
                top: `${top}px`,
                left: `${left}px`,
                transform: 'translateX(-100%)', // Выравниваем по правому краю
                zIndex: 10,
                // Делаем меню видимым после расчёта
                opacity: 1,
            });
        }

        // Если меню закрывается, снова делаем его невидимым
        if (!isOpen) {
            setMenuStyle({ opacity: 0, pointerEvents: 'none' });
        }
    }, [isOpen]);

    // Этот хук отвечает за закрытие меню по клику вне его
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (e) => {
            if (
                !buttonRef.current?.contains(e.target) &&
                !menuRef.current?.contains(e.target)
            ) {
                onToggle();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onToggle]);

    return (
        <>
            <button
                className={styles.dropdownButton}
                title="Дополнительные опции"
                onClick={onToggle} // <-- Просто вызываем onToggle
                ref={buttonRef}
            >
                {triggerContent}
            </button>

            {isOpen && createPortal(
                <div
                    className={styles.menu}
                    style={menuStyle}
                    ref={menuRef}
                >
                    {items.map((item, index) => {
                        if (item.isSeparator) {
                            return <div key={`separator-${index}`} className={styles.separator} />;
                        }

                        const itemClasses = classNames(
                            styles.menuItem,
                            { [styles.destructive]: item.isDestructive }
                        );

                        return (
                            <button
                                key={item.label || index}
                                className={itemClasses}
                                disabled={item.disabled}
                                onClick={() => {
                                    item.onClick?.();
                                    onToggle();
                                }}
                            >
                                {item.icon && <span className={styles.icon}>{item.icon}</span>}
                                {item.label}
                            </button>
                        );
                    })}
                </div>,
                document.body
            )}
        </>
    );
};

export default DropdownMenu;