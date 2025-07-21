import { useEffect } from 'react';
import { useBlockManager } from '../contexts/BlockManagementContext';
import * as patternApi from '../services/patternApi';

export const usePatternManager = () => {
    const { patterns, selectedBlockId, actions, blocks } = useBlockManager();

    useEffect(() => {
        const loadPatterns = async () => {
            try {
                const loadedPatterns = await patternApi.fetchPatterns();
                actions.setPatterns(loadedPatterns);
            } catch (error) {
                console.error(error);
            }
        };
        loadPatterns();
    }, [actions]);

    const handleSaveAsPattern = async () => {
        if (!selectedBlockId) return alert('Сначала выберите блок');
        const patternName = prompt('Введите название для нового паттерна:');
        if (!patternName) return;

        const { findBlockAndParent } = await import('../utils/blockUtils');
        const { block: blockData } = findBlockAndParent(blocks, selectedBlockId);

        try {
            const newPattern = await patternApi.savePattern(blockData, patternName);
            actions.addPattern(newPattern);
            alert('Паттерн успешно сохранен!');
        } catch (error) {
            console.error(error);
            alert(`Произошла ошибка при сохранении: ${error.message}`);
        }
    };

    const handleDeletePattern = async (patternId) => {
        if (!window.confirm('Вы уверены?')) return;
        try {
            await patternApi.deletePattern(patternId);
            actions.removePattern(patternId);
            alert('Паттерн удален.');
        } catch (error) {
            console.error(error);
            alert('Не удалось удалить паттерн.');
        }
    };

    return { patterns, handleSaveAsPattern, handleDeletePattern };
};