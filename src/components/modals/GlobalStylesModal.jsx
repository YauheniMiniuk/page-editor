import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import styles from './Modal.module.css'; // Используем общие стили для модалок
import { useGlobalStyles } from '../../contexts/GlobalStylesContext';
import ClassEditForm from './ClassEditForm';
import Button from '../../ui/Button';

const GlobalStylesModal = ({ isOpen, onClose }) => {
    const { globalClasses, actions } = useGlobalStyles();
    const [editingClass, setEditingClass] = useState(null); // null | 'new' | {classObject}

    if (!isOpen) return null;

    const handleSave = (classData) => {
        if (classData.id) {
            actions.updateClass(classData.id, classData);
        } else {
            actions.addClass(classData);
        }
        setEditingClass(null); // Закрываем форму
    };

    const renderContent = () => {
        if (editingClass) {
            return (
                <ClassEditForm
                    initialData={editingClass === 'new' ? {} : editingClass}
                    onSave={handleSave}
                    onCancel={() => setEditingClass(null)}
                />
            );
        }

        return (
            <div className={styles.classList}>
                {globalClasses.map(cls => (
                    <div key={cls.id} className={styles.classItem}>
                        <div className={styles.classInfo}>
                            <strong>{cls.label}</strong>
                            <span>.{cls.name}</span>
                        </div>
                        <div className={styles.classActions}>
                            <Button small onClick={() => setEditingClass(cls)}>Редактировать</Button>
                            <Button small danger onClick={() => actions.deleteClass(cls.id)}>Удалить</Button>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return ReactDOM.createPortal(
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <header className={styles.header}>
                    <h2>Менеджер Глобальных Стилей</h2>
                    <button onClick={onClose} className={styles.closeButton}>×</button>
                </header>
                <main className={styles.content}>
                    {renderContent()}
                </main>
                <footer className={styles.footer}>
                    {/* Если не в режиме редактирования, показываем кнопку "Создать" */}
                    {!editingClass && (
                         <Button primary onClick={() => setEditingClass('new')}>
                            Создать новый класс
                        </Button>
                    )}
                    <Button onClick={onClose}>Закрыть</Button>
                </footer>
            </div>
        </div>,
        document.getElementById('portal-root') // Убедись, что этот элемент есть в твоем index.html
    );
};

export default GlobalStylesModal;