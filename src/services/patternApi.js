import html2canvas from 'html2canvas';

export const fetchPatterns = async () => {
    const response = await fetch('/api/patterns');
    if (!response.ok) throw new Error('Ошибка загрузки паттернов');

    const loadedPatterns = await response.json();
    return loadedPatterns.map(pattern => {
        const content = (pattern.content && typeof pattern.content === 'string')
            ? JSON.parse(pattern.content)
            : pattern.content;
        return {
            ...pattern,
            content,
            previewImage: `/api${pattern.preview_image}`
        };
    });
};

export const savePattern = async (blockData, patternName) => {
    const nodeToCapture = document.querySelector(`[data-block-id="${blockData.id}"]`);
    if (!nodeToCapture) throw new Error('Не найден DOM-узел для создания превью.');

    const canvas = await html2canvas(nodeToCapture, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true
    });
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));

    const formData = new FormData();
    formData.append('name', patternName);
    formData.append('content', JSON.stringify(blockData));
    formData.append('previewImage', blob, `${patternName.replace(/\s+/g, '-')}.png`);

    const response = await fetch('/api/patterns', {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Ошибка сохранения паттерна');
    }

    const newPattern = await response.json();
    return {
        ...newPattern,
        previewImage: newPattern.preview_image ? `/api${newPattern.preview_image}` : null
    };
};

export const deletePattern = async (patternId) => {
    const response = await fetch(`/api/patterns/${patternId}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Ошибка удаления паттерна');
};