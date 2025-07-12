import { useState, useCallback } from 'react';

export const useInlineEditing = (initialContent, onUpdate) => {
    const [isEditing, setIsEditing] = useState(false);
    const [tempContent, setTempContent] = useState(initialContent);

    const startEditing = useCallback((e, dndRest) => {
        setIsEditing(true);
        dndRest.onDoubleClick?.(e); // Вызываем оригинальный onDoubleClick, если есть
    }, []);

    const saveChanges = useCallback((e) => {
        setIsEditing(false);
        const newContent = e.currentTarget.innerHTML;
        if (newContent !== initialContent) {
            onUpdate(newContent);
        }
    }, [initialContent, onUpdate]);

    const handleInput = useCallback((e) => {
        // Мы можем временно хранить контент здесь, если нужно,
        // но основной фикс - в onBlur и синхронизации в TextBlock
    }, []);

    return {
        isEditing,
        startEditing,
        saveChanges,
        handleInput,
        // Пропсы, которые нужно передать на редактируемый элемент
        editingProps: {
            onBlur: saveChanges,
            onInput: handleInput,
        },
        // Атрибуты для отключения dnd во время редактирования
        dndAttributes: {
            draggable: !isEditing,
        }
    };
};