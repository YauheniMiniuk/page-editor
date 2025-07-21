import React, { useState, useRef } from 'react';
import { UploadCloud } from 'lucide-react';
import styles from '../media/Uploader.module.css'; // Снова переиспользуем эти стили
import { useBlockManager } from '../../contexts/BlockManagementContext';

const FontUploader = ({ onUploadComplete }) => {
    const [fontFile, setFontFile] = useState(null);
    const [fontName, setFontName] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const inputRef = useRef(null);
    const { actions } = useBlockManager();

    const processFile = (file) => {
        if (!file) return;
        if (!['font/woff', 'font/woff2'].includes(file.type)) {
            actions.addNotification('Выберите файл в формате .woff или .woff2', 'error');
            return;
        }
        // Устанавливаем имя по умолчанию из имени файла
        setFontName(file.name.replace(/\.(woff|woff2)$/, ''));
        setFontFile(file);
    };

    const handleUpload = async () => {
        if (!fontFile || !fontName) {
            actions.addNotification('Укажите имя шрифта и выберите файл', 'error');
            return;
        }

        setIsLoading(true);
        const formData = new FormData();
        formData.append('fontName', fontName);
        formData.append('fontFile', fontFile); // 'fontFile' - имя поля для multer

        try {
            const response = await fetch('/api/fonts/custom/', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) throw new Error('Ошибка при загрузке шрифта');

            const newFont = await response.json();
            actions.addNotification(`Шрифт "${fontName}" успешно загружен!`, 'success');
            onUploadComplete(newFont);
            setFontFile(null);
            setFontName('');

        } catch (error) {
            actions.addNotification(error.message, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDragEnter = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
    const handleDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
    const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); };
    const handleDrop = (e) => {
        e.preventDefault(); e.stopPropagation(); setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processFile(e.dataTransfer.files[0]);
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
                    accept=".woff, .woff2"
                    className={styles.hiddenInput}
                    onChange={(e) => processFile(e.target.files[0])}
                />
                <div className={styles.dropZoneContent}>
                    <UploadCloud size={48} className={styles.icon} />
                    <p><b>Перетащите файл шрифтов сюда</b> или нажмите для выбора</p>
                    <span className={styles.info}>Поддерживаются только файлы .woff и .woff2</span>
                </div>
            </div>
            {fontFile && (
                <div className={styles.fileListContainer}>
                    <input
                        type="text"
                        placeholder="Название шрифта (например, MyFont)"
                        value={fontName}
                        onChange={(e) => setFontName(e.target.value)}
                        className={styles.fontNameInput} // Добавим стиль для этого инпута
                    />
                    <p>Выбранный файл: {fontFile.name}</p>
                    <button onClick={handleUpload} className={styles.uploadButton} disabled={isLoading}>
                        {isLoading ? 'Загрузка...' : 'Загрузить шрифт'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default FontUploader;