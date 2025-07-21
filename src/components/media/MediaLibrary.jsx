import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import Tabs from '../../ui/Tabs'; // Предположим, у тебя есть компонент вкладок
import Tab from '../../ui/Tab';
import styles from './MediaLibrary.module.css';
import Uploader from './Uploader';
import MediaGrid from './MediaGrid';

const MediaLibrary = ({ isOpen, onClose, onSelect }) => {
    const [activeTab, setActiveTab] = useState('library'); // 2. Добавляем стейт для вкладок
    const [media, setMedia] = useState([]);
    const [selectedMedia, setSelectedMedia] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [preselectedId, setPreselectedId] = useState(null);

    // Загружаем файлы при открытии
    useEffect(() => {
        if (isOpen) {
            setIsLoading(true);
            fetch('/api/media')
                .then(res => res.json())
                .then(data => {
                    setMedia(data);
                    setIsLoading(false);
                });
        }
    }, [isOpen]);

    const handleUploadComplete = (uploadedFiles) => {
        // Добавляем новые файлы в начало списка
        setMedia(prev => [...uploadedFiles, ...prev]);
        // Переключаемся на вкладку "Библиотека"
        setActiveTab('library');
        // Выделяем первый из загруженных файлов
        setSelectedMedia(uploadedFiles[0]);
        setPreselectedId(uploadedFiles[0].id);
    };

    const handleSelect = () => {
        if (selectedMedia) {
            onSelect(selectedMedia); // Вызываем колбэк, переданный родителем
            onClose(); // Закрываем библиотеку
        }
    };

    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <header className={styles.header}>
                    <h2>Библиотека медиафайлов</h2>
                    <button onClick={onClose} className={styles.closeButton}>×</button>
                </header>
                <main className={styles.content}>
                    <Tabs>
                        <Tab title="Библиотека">
                            <MediaGrid onFileSelect={setSelectedMedia} preselectedId={preselectedId} />
                        </Tab>
                        <Tab title="Загрузить файлы">
                            <Uploader onUploadComplete={handleUploadComplete} />
                        </Tab>
                    </Tabs>
                </main>
                <footer className={styles.footer}>
                    <button onClick={handleSelect} disabled={!selectedMedia} className={styles.selectButton}>
                        Выбрать
                    </button>
                </footer>
            </div>
        </div>,
        document.getElementById('portal-root')
    );
};

export default MediaLibrary;