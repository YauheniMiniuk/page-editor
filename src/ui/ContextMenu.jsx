import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import styles from './ContextMenu.module.css';

const portalRoot = document.getElementById('portal-root');

const ContextMenu = ({ isOpen, items, position, onClose }) => {
    const menuRef = useRef(null);

    // Закрываем меню по клику вне его
    useEffect(() => {
        if (!isOpen) return;
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onClose]);

    const handleItemClick = (item) => {
        if (!item.disabled && item.onClick) {
            item.onClick();
        }
        onClose();
    };

    const handleInternalContextMenu = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const menuStyle = {
        top: `${position.y}px`,
        left: `${position.x}px`,
    };

    if (!isOpen) return;

    const menuContent = (
        <div ref={menuRef}
            className={styles.contextMenu}
            style={menuStyle}
            onContextMenu={handleInternalContextMenu}
        >
            {items.map((item, index) => (
                item.isSeparator
                    ? <div key={index} className={styles.separator} />
                    : (
                        <button
                            key={index}
                            className={`${styles.menuItem} ${item.isDestructive ? styles.destructive : ''}`}
                            onClick={() => handleItemClick(item)}
                            disabled={item.disabled}
                        >
                            {item.icon && <span className={styles.icon}>{item.icon}</span>}
                            <span>{item.label}</span>
                        </button>
                    )
            ))}
        </div>
    );

    return ReactDOM.createPortal(menuContent, portalRoot);
};

export default ContextMenu;