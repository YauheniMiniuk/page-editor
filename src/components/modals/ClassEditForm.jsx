import React, { useState } from 'react';
import styles from './ClassEditForm.module.css';
import Input from '../../ui/Input';
import Button from '../../ui/Button';
import CssEditor from '../../ui/CssEditor'; // <-- 1. Импортируем наш новый редактор

const ClassEditForm = ({ initialData = {}, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        title: '',
        css: '',
        ...initialData
    });
    const [error, setError] = useState('');

    // Обработчик для обычных инпутов
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // 2. Отдельный обработчик для СssEditor, т.к. он возвращает только значение
    const handleCssChange = (value) => {
        setFormData(prev => ({ ...prev, css: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.title) {
            setError('Название обязательно.');
            return;
        }
        setError('');
        onSave(formData);
    };
    
    return (
        <form onSubmit={handleSubmit} className={styles.form}>
            <h4>{initialData.id ? 'Редактировать стили' : 'Создать новые стили'}</h4>
            {error && <p className={styles.error}>{error}</p>}
            
            <Input
                label="Название"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Стили для кнопок"
            />

            {/* 3. Заменяем Textarea на CssEditor */}
            <div className={styles.editorLabel}>CSS-код</div>
            <div className={styles.editorWrapper}>
                <CssEditor
                    value={formData.css}
                    onChange={handleCssChange}
                />
            </div>

            <div className={styles.actions}>
                <Button type="button" onClick={onCancel}>Отмена</Button>
                <Button type="submit" primary>Сохранить</Button>
            </div>
        </form>
    );
};

export default ClassEditForm;