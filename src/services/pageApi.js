// Рекурсивно парсит JSON-строки в `children`
const deepParseBlocks = (blocksToParse) => {
    if (!Array.isArray(blocksToParse)) return [];
    return blocksToParse.map(block => {
        const newBlock = { ...block };
        if (newBlock.children && typeof newBlock.children === 'string') {
            try {
                newBlock.children = deepParseBlocks(JSON.parse(newBlock.children));
            } catch (e) { newBlock.children = []; }
        } else if (Array.isArray(newBlock.children)) {
            newBlock.children = deepParseBlocks(newBlock.children);
        }
        return newBlock;
    });
};

export const fetchPageData = async (slug, versionId, mode) => {
    const apiUrl = versionId
        ? `/api/pages/${slug}?mode=${mode}&version=${versionId}`
        : `/api/pages/${slug}?mode=${mode}`;

    const response = await fetch(apiUrl);
    if (!response.ok) {
        throw new Error(`Страница не найдена или ошибка сервера (статус: ${response.status})`);
    }

    const { page, version } = await response.json();
    let contentBlocks = [];
    if (version && version.content) {
        const initialParsed = typeof version.content === 'string'
            ? JSON.parse(version.content)
            : version.content;
        contentBlocks = deepParseBlocks(initialParsed);
    }

    return {
        page,
        version,
        blocks: Array.isArray(contentBlocks) ? contentBlocks : [],
    };
};

export const createNewPage = async (title, slug, blocks) => {
    const response = await fetch(`/api/pages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            slug,
            title,
            content: blocks,
            version_title: `Первая версия: ${title}`,
            analytics_round: new Date().toISOString().slice(0, 10),
        }),
    });
    if (!response.ok) throw new Error('Ошибка при создании страницы');
    return response.json();
};

export const createNewVersion = async (slug, blocks) => {
    const response = await fetch(`/api/pages/${slug}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            content: blocks,
            version_title: `Обновление от ${new Date().toLocaleString()}`,
            analytics_round: new Date().toISOString().slice(0, 10),
        }),
    });
    if (!response.ok) throw new Error('Ошибка сохранения');
    return response.json();
};

export const publishVersion = async (slug, versionId) => {
    const response = await fetch(`/api/pages/${slug}/versions/${versionId}/publish`, {
        method: 'PUT',
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Ошибка публикации');
    }
    return response.json();
};