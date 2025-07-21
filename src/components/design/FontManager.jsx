import React, { useState, useEffect } from 'react';
import styles from './DesignModal.module.css';
import FontUploader from './FontUploader';
import Tabs from '../../ui/Tabs';
import Tab from '../../ui/Tab';
import { ExternalLink } from 'lucide-react';

const FontManager = () => {
    const [fonts, setFonts] = useState([]);
    const [googleFontUrl, setGoogleFontUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const fetchFonts = async () => {
        const res = await fetch('/api/fonts/');
        const data = await res.json();
        setFonts(data);
    };

    useEffect(() => {
        fetchFonts();
    }, []);

    const handleAddGoogleFont = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            // Отправляем полную ссылку
            await fetch('/api/fonts/google/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fontUrl: googleFontUrl })
            });
            setGoogleFontUrl(''); // Очищаем поле
            await fetchFonts();
        } finally {
            setIsLoading(false);
        }
    };

    const handleUploadComplete = () => {
        fetchFonts(); // Просто обновляем список после загрузки
    };

    return (
        <div className={styles.managerContainer}>
            <h4>Установленные шрифты</h4>
            <ul className={styles.list}>
                {fonts.map(font => <li key={font.id} className={styles.listItem}>{font.name}</li>)}
            </ul>
            <hr className={styles.hr} />
            <h4>Добавить шрифт</h4>
            <Tabs>
                <Tab title="Google Fonts">
                    <p className={styles.helperText}>
                        1. Выберите шрифт в <a href="https://fonts.google.com/" target="_blank" rel="noopener noreferrer">библиотеке</a>.<br />
                        2. Нажмите "Get font" → "Get embed code".<br />
                        3. Скопируйте и вставьте сюда всю ссылку из тега &lt;link&gt;.
                    </p>
                    <form onSubmit={handleAddGoogleFont} className={styles.form}>
                        <input
                            value={googleFontUrl}
                            onChange={e => setGoogleFontUrl(e.target.value)}
                            // Обновляем плейсхолдер
                            placeholder="https://fonts.googleapis.com/css2?family=..."
                            className={styles.input}
                            disabled={isLoading}
                        />
                        <button type="submit" className={styles.button} disabled={isLoading}>
                            {isLoading ? 'Загрузка...' : 'Скачать и добавить'}
                        </button>
                    </form>
                </Tab>
                <Tab title="Загрузить свой">
                    <FontUploader onUploadComplete={handleUploadComplete} />
                </Tab>
            </Tabs>
        </div>
    );
};

export default FontManager;