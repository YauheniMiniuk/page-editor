import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useBlockManager } from '../contexts/BlockManagementContext';
import * as pageApi from '../services/pageApi';

export const usePageData = (initialMode) => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const versionId = searchParams.get('version');
    const { blocks, actions } = useBlockManager();

    const [isLoading, setIsLoading] = useState(true);
    const [isNewPage, setIsNewPage] = useState(false);
    const [pageTitle, setPageTitle] = useState('Новая страница');
    const [mode, setMode] = useState(initialMode);
    const [pageStatus, setPageStatus] = useState({ isLive: false, isNewPage: false });
    const [lastSavedBlocks, setLastSavedBlocks] = useState(null);

    useEffect(() => {
        if (slug === 'new') {
            setIsNewPage(true);
            setPageStatus({ isLive: false, isNewPage: true });
            actions.resetHistory([]);
            setLastSavedBlocks([]);
            setIsLoading(false);
            return;
        }
        if (!slug) {
            setIsLoading(false);
            return;
        }

        const loadData = async () => {
            setIsLoading(true);
            try {
                const { page, version, blocks: contentBlocks } = await pageApi.fetchPageData(slug, versionId, mode);
                setIsNewPage(false);
                setPageTitle(page.title);
                setPageStatus({ isLive: page.live_version_id === version?.id, isNewPage: false });
                actions.resetHistory(contentBlocks);
                setLastSavedBlocks(contentBlocks);
            } catch (error) {
                console.error("Ошибка загрузки страницы:", error.message);
                if (error.message.includes('404')) setIsNewPage(true);
                actions.setBlocks([]);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [slug, mode, versionId]);

    const handleSave = async () => {
        try {
            let result;
            if (isNewPage) {
                const title = prompt("Введите заголовок для новой страницы:");
                if (!title) return;
                const finalSlug = (slug === 'new') ? prompt("Введите slug для URL:", title.toLowerCase().replace(/\s+/g, '-')) : slug;
                if (!finalSlug) return;
                result = await pageApi.createNewPage(title, finalSlug, blocks);
                alert(`Страница успешно создана!`);
                navigate(`/editor/${finalSlug}?version=${result.versionId}`, { replace: true });
            } else {
                result = await pageApi.createNewVersion(slug, blocks);
                alert(`Новый черновик сохранен! ID версии: ${result.versionId}`);
                navigate(`/editor/${slug}?version=${result.versionId}`, { replace: true });
            }
            setLastSavedBlocks(blocks);
        } catch (error) {
            console.error('Ошибка сохранения:', error);
            alert(`Произошла ошибка: ${error.message}`);
        }
    };

    const handlePublish = async () => {
        if (isNewPage || !slug || !versionId) return alert('Сначала сохраните страницу как черновик.');
        if (window.confirm(`Опубликовать эту версию?`)) {
            try {
                await pageApi.publishVersion(slug, versionId);
                alert('Версия успешно опубликована!');
                setPageStatus(prev => ({ ...prev, isLive: true }));
            } catch (error) {
                console.error('Ошибка публикации:', error);
                alert(`Ошибка: ${error.message}`);
            }
        }
    };

    const isDirty = useMemo(() => {
        if (lastSavedBlocks === null) return false;
        return JSON.stringify(blocks) !== JSON.stringify(lastSavedBlocks);
    }, [blocks, lastSavedBlocks]);

    return {
        isLoading,
        isNewPage,
        pageTitle,
        mode,
        setMode,
        pageStatus,
        handleSave,
        handlePublish,
        isDirty,
    };
};