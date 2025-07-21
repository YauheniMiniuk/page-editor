import React, { useState, useEffect } from 'react';
import { useBlockManager } from '../../contexts/BlockManagementContext';
import styles from './MediaGrid.module.css';
import { Trash2 } from 'lucide-react';

const MediaGrid = ({ onFileSelect, preselectedId }) => {
    const { actions } = useBlockManager();
    const [media, setMedia] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [details, setDetails] = useState({ alt_text: '', caption: '' });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        fetch('/api/media/')
            .then(res => res.json())
            .then(data => {
                setMedia(data);
                if (preselectedId) {
                    const preselected = data.find(f => f.id === preselectedId);
                    if (preselected) handleSelect(preselected);
                }
            })
            .finally(() => setIsLoading(false));
    }, [preselectedId]);

    // Обновляем детали в форме, когда меняется выбранный файл
    useEffect(() => {
        if (selectedFile) {
            setDetails({
                alt_text: selectedFile.alt_text || '',
                caption: selectedFile.caption || '',
            });
        }
    }, [selectedFile]);

    const handleSelect = (file) => {
        setSelectedFile(file);
        onFileSelect(file);
    };

    const handleDetailChange = (e) => {
        const { name, value } = e.target;
        setDetails(prev => ({ ...prev, [name]: value }));
    };

    // --- ПОЛНЫЙ КОД ДЛЯ СОХРАНЕНИЯ ДЕТАЛЕЙ ---
    const handleDetailsSave = async () => {
        if (!selectedFile) return;

        try {
            const response = await fetch(`/api/media/${selectedFile.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(details),
            });

            if (!response.ok) throw new Error('Ошибка сохранения деталей');

            // Обновляем данные в общем списке без перезагрузки
            setMedia(prevMedia =>
                prevMedia.map(file =>
                    file.id === selectedFile.id ? { ...file, ...details } : file
                )
            );
            actions.addNotification('Детали файла сохранены', 'success');

        } catch (error) {
            console.error(error);
            actions.addNotification('Не удалось сохранить детали', 'error');
        }
    };

    const handleDelete = async () => {
        if (!selectedFile) return;

        // Запрашиваем подтверждение у пользователя
        if (!window.confirm(`Вы уверены, что хотите удалить файл "${selectedFile.filename}"? Это действие необратимо.`)) {
            return;
        }

        try {
            const response = await fetch(`/api/media/${selectedFile.id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Ошибка при удалении файла.');
            }

            // Обновляем состояние в UI
            setMedia(prev => prev.filter(f => f.id !== selectedFile.id));
            setSelectedFile(null); // Сбрасываем выделение
            onFileSelect(null); // Сообщаем родителю, что выделение снято

            actions.addNotification('Файл успешно удален', 'success');

        } catch (error) {
            console.error(error);
            actions.addNotification('Не удалось удалить файл', 'error');
        }
    };

    if (isLoading) return <p style={{ width: '100%', textAlign: 'center' }}>Загрузка медиафайлов...</p>;

    return (
        <div className={styles.gridContainer}>
            {media.length > 0
                ? (
                    <div className={styles.grid}>
                        {media.map(file => (
                            <button
                                key={file.id}
                                className={`${styles.gridItem} ${selectedFile?.id === file.id ? styles.selected : ''}`}
                                onClick={() => handleSelect(file)}
                            >
                                <img src={file.filepath} alt={file.alt_text} className={styles.thumbnail} />
                                <span className={styles.fileName}>{file.filename}</span>
                            </button>
                        ))}
                    </div>
                )
                : (
                    <span style={{ width: '100%', textAlign: 'center' }}>В библиотеке пока нет файлов.</span>
                )
            }


            {selectedFile && (
                <div className={styles.sidebar}>
                    <div className={styles.sidebarContent}>
                        <h4>Детали файла</h4>
                        {/* <img src={selectedFile.filepath} alt="Превью" className={styles.sidebarPreview} /> */}

                        <label>Имя файла</label>
                        <p className={styles.sidebarFilename}>{selectedFile.filename}</p>

                        <label htmlFor="alt_text">Альтернативный текст (alt)</label>
                        <input
                            id="alt_text"
                            name="alt_text"
                            type="text"
                            value={details.alt_text}
                            onChange={handleDetailChange}
                            className={styles.input}
                        />

                        <label htmlFor="caption">Подпись</label>
                        <textarea
                            id="caption"
                            name="caption"
                            rows="3"
                            value={details.caption}
                            onChange={handleDetailChange}
                            className={styles.input}
                        ></textarea>
                    </div>

                    <div className={styles.sidebarActions}>
                        <button onClick={handleDetailsSave} className={styles.saveButton}>Сохранить изменения</button>
                        <button onClick={handleDelete} className={styles.deleteButton}>
                            <Trash2 size={16} />
                            Удалить навсегда
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MediaGrid;