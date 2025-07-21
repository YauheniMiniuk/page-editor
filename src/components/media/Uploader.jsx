import React, { useState, useRef, useCallback } from 'react';
import styles from './Uploader.module.css';
import { UploadCloud, File, X } from 'lucide-react'; // Иконки для UI
import { useBlockManager } from '../../contexts/BlockManagementContext';

const Uploader = ({ onUploadComplete }) => {
    const [filesToUpload, setFilesToUpload] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const inputRef = useRef(null);

    const { actions } = useBlockManager();

    // Обработчик для выбора файлов (через кнопку или drop)
    const handleFilesSelected = (selectedFiles) => {
        const newFiles = Array.from(selectedFiles);
        setFilesToUpload(prev => [...prev, ...newFiles]);
    };

    // --- Логика Drag & Drop ---
    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation(); // Обязательно, чтобы сработал onDrop
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const droppedFiles = e.dataTransfer.files;
        if (droppedFiles && droppedFiles.length > 0) {
            handleFilesSelected(droppedFiles);
        }
    };

    // --- Управление файлами ---
    const removeFile = (fileName) => {
        setFilesToUpload(prev => prev.filter(f => f.name !== fileName));
    };

    // --- Загрузка на сервер ---
    const handleUpload = async () => {
        if (filesToUpload.length === 0) return;

        setIsUploading(true);
        const formData = new FormData();
        filesToUpload.forEach(file => {
            formData.append('mediaFiles', file);
        });

        let notificationId = null;
        try {
            notificationId = actions.addNotification('Загрузка файлов...', 'loading', null);

            const response = await fetch('/api/media', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Неизвестная ошибка сервера');
            }

            const uploadedData = await response.json();

            actions.removeNotification(notificationId);
            actions.addNotification('Файлы успешно загружены!');

            onUploadComplete(uploadedData);
            setFilesToUpload([]);

        } catch (error) {
            if (notificationId) actions.removeNotification(notificationId);
            actions.addNotification(error.message, 'error');
            console.error(error);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className={styles.uploaderContainer}>
            {/* 1. Drop-зона */}
            <div
                className={`${styles.dropZone} ${isDragging ? styles.dragging : ''}`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => inputRef.current.click()} // Открываем диалог по клику на зону
            >
                <input
                    ref={inputRef}
                    type="file"
                    multiple // Позволяет выбирать несколько файлов
                    className={styles.hiddenInput}
                    onChange={(e) => handleFilesSelected(e.target.files)}
                />
                <div className={styles.dropZoneContent}>
                    <UploadCloud size={48} className={styles.icon} />
                    <p><b>Перетащите файлы сюда</b> или нажмите для выбора</p>
                    <span className={styles.info}>Максимальный размер файла: 50MB</span>
                </div>
            </div>

            {/* 2. Список файлов и кнопка "Загрузить" */}
            {filesToUpload.length > 0 && (
                <div className={styles.fileListContainer}>
                    <h4>Файлы для загрузки:</h4>
                    <ul className={styles.fileList}>
                        {filesToUpload.map((file, index) => (
                            <li key={index} className={styles.fileItem}>
                                <File size={20} />
                                <span className={styles.fileName}>{file.name}</span>
                                <span className={styles.fileSize}>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                                <button onClick={() => removeFile(file.name)} className={styles.removeButton} title="Удалить">
                                    <X size={16} />
                                </button>
                            </li>
                        ))}
                    </ul>
                    <button onClick={handleUpload} className={styles.uploadButton} disabled={isUploading}>
                        {isUploading ? 'Загрузка...' : `Загрузить ${filesToUpload.length} файл(ов)`}
                    </button>
                </div>
            )}
        </div>
    );
};

export default Uploader;