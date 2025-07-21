import React, { useState, useRef } from 'react';
import { UploadCloud } from 'lucide-react';
import styles from '../media/Uploader.module.css'; // Используем те же стили, что и для медиа!
import { useBlockManager } from '../../contexts/BlockManagementContext';

const ThemeUploader = ({ onUploadComplete }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const inputRef = useRef(null);
    const { actions } = useBlockManager();

    const processFile = (file) => {
        if (!file || file.type !== 'application/json') {
            actions.addNotification('Пожалуйста, выберите файл в формате .json', 'error');
            return;
        }

        const reader = new FileReader();

        reader.onload = async (event) => {
            try {
                const themeContent = JSON.parse(event.target.result);
                const themeName = file.name.replace(/\.json$/, ''); // Имя файла без расширения

                setIsLoading(true);

                const response = await fetch('/api/themes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: themeName, styles_json: themeContent }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Не удалось создать тему');
                }

                const newTheme = await response.json();
                actions.addNotification(`Тема "${themeName}" успешно импортирована!`, 'success');
                onUploadComplete(newTheme);

            } catch (e) {
                actions.addNotification('Ошибка при чтении или отправке файла темы.', 'error');
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        };

        reader.readAsText(file);
    };

    // --- Логика Drag & Drop (такая же, как в Uploader) ---
    const handleDragEnter = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
    const handleDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
    const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); };
    const handleDrop = (e) => {
        e.preventDefault(); e.stopPropagation(); setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processFile(e.dataTransfer.files[0]); // Берем только первый файл
            e.dataTransfer.clearData();
        }
    };
    
    return (
        <div className={styles.uploaderContainer}>
            <div
                className={`${styles.dropZone} ${isDragging ? styles.dragging : ''}`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => inputRef.current.click()}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept=".json" // Принимаем только .json
                    className={styles.hiddenInput}
                    onChange={(e) => processFile(e.target.files[0])}
                />
                <div className={styles.dropZoneContent}>
                    <UploadCloud size={48} className={styles.icon} />
                    <p><b>Перетащите файл темы сюда</b> или нажмите для выбора</p>
                    <span className={styles.info}>Поддерживаются только файлы .json</span>
                </div>
            </div>
            {isLoading && <p>Импорт темы...</p>}
        </div>
    );
};

export default ThemeUploader;