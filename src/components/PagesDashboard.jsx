import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './PagesDashboard.module.css';

/**
 * Вложенный компонент для отображения списка версий для одной страницы.
 */
const VersionList = ({ page, onActionComplete }) => {
    const [versions, setVersions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    const { slug } = page;

    useEffect(() => {
        const fetchVersions = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`http://localhost:3001/pages/${slug}/versions`);
                if (!response.ok) throw new Error('Could not load versions');
                const data = await response.json();
                setVersions(data);
            } catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchVersions();
    }, [slug]);

    const handleDeleteVersion = async (versionId) => {
        if (!window.confirm(`Вы уверены, что хотите удалить версию ID: ${versionId}? Это действие необратимо.`)) return;
        try {
            const response = await fetch(`http://localhost:3001/pages/${slug}/versions/${versionId}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Error deleting version');
            onActionComplete(); // Refresh all data
        } catch (error) {
            alert(error.message);
        }
    };

    const handlePublishVersion = async (versionId) => {
        const versionToPublish = versions.find(v => v.id === versionId);
        if (!window.confirm(`Опубликовать версию v${versionToPublish?.version_number}? Она станет видна всем пользователям.`)) return;
        try {
            const response = await fetch(`http://localhost:3001/pages/${slug}/versions/${versionId}/publish`, { method: 'PUT' });
            if (!response.ok) throw new Error('Error publishing version');
            alert('Версия успешно опубликована!');
            onActionComplete(); // Refresh all data
        } catch (error) {
            alert(error.message);
        }
    };

    if (isLoading) return <p className={styles.versionsLoading}>Загрузка версий...</p>;

    return (
        <div className={styles.versionsList}>
            {versions.map(version => (
                <div key={version.id} className={`${styles.versionItem} ${styles[version.status]}`}>
                    <div className={styles.versionInfo}>
                        {page.live_version_id === version.id && <span title="Опубликованная версия">🟢 </span>}
                        {page.draft_version_id === version.id && <span title="Последний черновик">✏️ </span>}
                        <strong>v{version.version_number}:</strong> {version.version_title} <span>({version.status})</span>
                    </div>
                    <div className={styles.versionActions}>
                        {page.live_version_id !== version.id && (
                            <button onClick={() => handlePublishVersion(version.id)}>Опубликовать</button>
                        )}
                        <button onClick={() => navigate(`/page/${slug}?version=${version.id}`)}>Смотреть</button>
                        <button onClick={() => navigate(`/editor/${slug}?version=${version.id}`)}>Редактировать</button>
                        <button className={styles.delete} onClick={() => handleDeleteVersion(version.id)}>Удалить</button>
                    </div>
                </div>
            ))}
        </div>
    );
};

/**
 * Основной компонент панели управления страницами.
 */
export default function PagesDashboard() {
    const [pages, setPages] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedPageId, setExpandedPageId] = useState(null);
    const navigate = useNavigate();

    const fetchPages = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch('http://localhost:3001/pages');
            if (!response.ok) throw new Error('Could not load pages');
            const data = await response.json();
            setPages(data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPages();
    }, [fetchPages]);

    const handleDeletePage = async (slug) => {
        if (!window.confirm(`Вы уверены, что хотите удалить страницу "${slug}" и все её версии?`)) return;
        try {
            const response = await fetch(`http://localhost:3001/pages/${slug}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Error deleting page');
            setPages(pages.filter(p => p.slug !== slug));
            alert('Страница успешно удалена');
        } catch (error) {
            alert(error.message);
        }
    };

    const toggleVersions = (pageId) => {
        setExpandedPageId(expandedPageId === pageId ? null : pageId);
    };

    if (isLoading) return <div>Загрузка списка страниц...</div>;

    return (
        <div className={styles.pagesDashboard}>
            <h1>Панель управления страницами</h1>
            <button className={styles.createPage} onClick={() => navigate('/editor/new')}>Создать новую страницу</button>
            <div className={styles.pagesList}>
                {pages.map(page => (
                    <div key={page.id} className={styles.pageItem}>
                        <div className={styles.pageHeader}>
                            <h2>{page.title} <small>(/{page.slug})</small></h2>
                            <div className={styles.pageActions}>
                                <button onClick={() => navigate(`/page/${page.slug}`)}>Смотреть</button>
                                <button onClick={() => navigate(`/editor/${page.slug}`)}>Редактировать</button>
                                <button className={styles.delete} onClick={() => handleDeletePage(page.slug)}>Удалить страницу</button>
                                <button onClick={() => toggleVersions(page.id)}>
                                    {expandedPageId === page.id ? 'Скрыть версии' : 'Показать версии'}
                                </button>
                            </div>
                        </div>
                        {expandedPageId === page.id && (
                            <VersionList page={page} onActionComplete={fetchPages} />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}