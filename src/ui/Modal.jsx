import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X as CloseIcon } from 'lucide-react';
import styles from './Modal.module.css';

// Получаем корневой элемент для портала
const portalRoot = document.getElementById('portal-root');

const Modal = ({ isOpen, onClose, title, children, style, className }) => {
    // Закрытие модального окна по нажатию на Escape
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);
    
    // AnimatePresence позволяет анимировать появление и исчезновение
    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className={styles.overlay}
                    // `onMouseDown` на оверлее всегда вызывает `onClose`
                    onMouseDown={onClose}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <motion.div
                        className={`${styles.modalWindow} ${className || ''}`}
                        style={style}
                        // Предотвращаем закрытие при клике внутри окна
                        onMouseDown={(e) => e.stopPropagation()}
                        initial={{ scale: 0.95, y: -20, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.95, y: -20, opacity: 0 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                    >
                        <header className={styles.modalHeader}>
                            <h3 className={styles.modalTitle}>{title}</h3>
                            <button className={styles.closeButton} onClick={onClose}>
                                <CloseIcon size={24} />
                            </button>
                        </header>
                        <main className={styles.modalBody}>
                            {children}
                        </main>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        portalRoot
    );
};

export default Modal;