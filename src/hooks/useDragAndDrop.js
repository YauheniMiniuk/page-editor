// src/hooks/useDragAndDrop.js
import { useState, useCallback, useMemo } from 'react';
import { useBlockManager } from '../contexts/BlockManagementContext';
import { nanoid } from 'nanoid';
import {
    findBlockAndParent,
    insertBlockRecursive,
    removeBlockRecursive,
    deepCloneWithNewIds,
    isAncestor,
    moveBlock,
} from '../utils/blockUtils';
import { AVAILABLE_BLOCKS, BLOCK_COMPONENTS } from '../utils/constants';

export const useDragAndDrop = (blockNodesRef, structureNodesRef) => {
    const { blocks, activeId, actions } = useBlockManager();
    const [dropIndicator, setDropIndicator] = useState(null);

    const activeBlock = useMemo(() => {
        if (!activeId) return null;

        // Проверяем, является ли перетаскиваемый элемент элементом сайдбара
        const isSidebarDrag = String(activeId).startsWith('sidebar-');

        if (isSidebarDrag) {
            // Если да, создаем временный блок для отображения в DragOverlay
            const type = String(activeId).replace('sidebar-', '');
            const info = AVAILABLE_BLOCKS.find(b => b.type === type);

            if (!info || !info.defaultData) {
                // Заглушка на случай, если блок не найден
                return { type: 'core/unknown', content: 'Новый блок' };
            }

            // Используем defaultData для создания блока-превью
            return { id: `preview-${nanoid()}`, ...info.defaultData() };
        } else {
            // Старая, рабочая логика для перетаскивания существующих блоков
            const data = findBlockAndParent(blocks, activeId);
            return data ? data.block : null;
        }
    }, [activeId, blocks]);

    const handleDragStart = ({ active }) => {
        // const draggedBlock = active.data.current?.isSidebarItem ? null : findBlockAndParent(blocks, active.id)?.block;
        // if (!active.data.current?.isSidebarItem && !draggedBlock) return;
        actions.setActiveId(active.id);
        actions.setInlineEditing(false);
        setDropIndicator(null);
    };

    const handleDragMove = useCallback((event) => {
        const { active, over, activatorEvent } = event;

        // Сбрасываем индикатор перед каждым вычислением
        setDropIndicator(null);

        // Если нет цели для сброса или тащим на себя, выходим
        if (!over || active.id === over.id) {
            return;
        }

        const isStructureDrag = active.data.current?.context === 'structure';

        // --- ЛОГИКА ДЛЯ ПАНЕЛИ СТРУКТУРЫ ---
        if (isStructureDrag) {
            const overId = over.id; // 'structure-...' или 'structure-root'
            const overContext = over.data.current?.context;

            // Нельзя бросать на себя (даже если ID с префиксом)
            if (active.id === over.id) return;

            // Сценарий 1: Перетаскиваем над корневой зоной панели
            if (overContext === 'structure-root') {
                setDropIndicator({
                    targetId: 'structure-root',
                    position: 'bottom',
                    context: 'structure',
                });
                return;
            }

            // Сценарий 2: Перетаскиваем над другим элементом структуры
            if (overContext === 'structure') {
                const overNode = structureNodesRef.current.get(over.id.replace('structure-', ''));
                if (!overNode) return;

                const realActiveId = active.data.current.blockId;
                const realOverId = over.data.current.blockId;

                const overBlock = over.data.current.block;
                if (isAncestor(active.data.current.block, overBlock)) return;

                const overNodeRect = overNode.getBoundingClientRect();
                const relativeY = activatorEvent.clientY - overNodeRect.top;
                const height = overNodeRect.height;

                const isContainer = BLOCK_COMPONENTS[overBlock.type]?.blockInfo.isContainer;
                const thresholdInner = isContainer ? 0.25 : 0; // 25% высоты сверху/снизу для вложения, если это контейнер

                let position;
                if (relativeY < height * thresholdInner) {
                    position = 'top';
                } else if (relativeY > height * (1 - thresholdInner)) {
                    position = 'bottom';
                } else if (isContainer) {
                    position = 'inner';
                } else {
                    // Если не контейнер, то делим пополам
                    position = relativeY < height / 2 ? 'top' : 'bottom';
                }

                setDropIndicator({
                    targetId: realOverId,
                    position,
                    context: 'structure',
                });
            }
            return; // Важно! Прерываем выполнение, чтобы не сработала логика канваса.
        }


        // --- ЛОГИКА ДЛЯ КАНВАСА (ТВОЙ ОРИГИНАЛЬНЫЙ КОД) ---
        // Не позволяем тащить из структуры на канвас (это можно будет реализовать позже)
        if (isStructureDrag) return;

        if (!active.rect.current.translated) {
            return;
        }

        // --- ШАГ 1: Определяем перетаскиваемый блок и его правила ---
        const activeData = active.data.current;
        let draggedBlockType;
        if (activeData.isPattern) {
            draggedBlockType = activeData.content?.type;
        } else {
            draggedBlockType = activeData.isNew
                ? activeData.type
                : activeData.block.type;
        }

        const { blockInfo: draggedBlockInfo } = BLOCK_COMPONENTS[draggedBlockType] || {};

        // --- ШАГ 2: Определяем контейнер для сброса ---
        let container, children;
        const overData = over.data.current;
        const overId = over.id;

        if (overId === 'canvas-root-dropzone') {
            container = { id: 'root', type: 'core/root' };
            children = blocks;
        } else {
            const found = findBlockAndParent(blocks, overId);
            if (!found) return;
            container = overData.isContainer ? found.block : (found.parent || { id: 'root', type: 'core/root' });
            children = container.id === 'root' ? blocks : container.children || [];
        }

        // --- ШАГ 3: Валидация ---
        let { blockInfo: containerInfo } = BLOCK_COMPONENTS[container.type] || {};
        console.log('Инфо контейнера: ', containerInfo);
        console.log('Инфо блока: ', draggedBlockInfo);
        if (containerInfo?.allowedBlocks && !containerInfo.allowedBlocks.includes(draggedBlockType)) return;
        if (draggedBlockInfo?.parent && !draggedBlockInfo.parent.includes(container.type)) return;

        const containerNode = (container.id === 'root')
            ? document.querySelector(`[data-droppable-id="canvas-root-dropzone"]`)
            : blockNodesRef.current.get(container.id);
        if (!containerNode) return;

        // --- ШАГ 4: Логика индикатора на канвасе ---
        const filteredChildren = children.filter(child => child.id !== active.id);
        const isEmpty = filteredChildren.length === 0;

        if (isEmpty) {
            setDropIndicator({
                rect: containerNode.getBoundingClientRect(),
                position: 'inner',
                targetId: container.id,
                isOverlay: true,
                context: 'canvas', // <-- Добавляем контекст
            });
            return;
        }

        const activeNodeRect = active.rect.current.translated;
        let layoutDirection = 'column';
        if (containerInfo && containerInfo.layoutDirection) {
            layoutDirection = typeof containerInfo.layoutDirection === 'function'
                ? containerInfo.layoutDirection(container)
                : containerInfo.layoutDirection;
        }

        let closest = { distance: Infinity, targetId: null, position: null };

        if (layoutDirection === 'column') {
            const activeCenterY = activeNodeRect.top + activeNodeRect.height / 2;
            for (let i = 0; i <= filteredChildren.length; i++) {
                let y, targetId, position;
                if (i === 0) {
                    y = blockNodesRef.current.get(filteredChildren[i].id)?.getBoundingClientRect().top;
                    targetId = filteredChildren[i].id;
                    position = 'top';
                } else if (i === filteredChildren.length) {
                    y = blockNodesRef.current.get(filteredChildren[i - 1].id)?.getBoundingClientRect().bottom;
                    targetId = filteredChildren[i - 1].id;
                    position = 'bottom';
                } else {
                    const topRect = blockNodesRef.current.get(filteredChildren[i - 1].id)?.getBoundingClientRect();
                    const bottomRect = blockNodesRef.current.get(filteredChildren[i].id)?.getBoundingClientRect();
                    if (!topRect || !bottomRect) continue;
                    y = topRect.bottom + (bottomRect.top - topRect.bottom) / 2;
                    targetId = filteredChildren[i - 1].id;
                    position = 'bottom';
                }
                if (y === undefined) continue;
                const distance = Math.abs(activeCenterY - y);
                if (distance < closest.distance) {
                    closest = { distance, targetId, position };
                }
            }
        } else { // layoutDirection === 'row'
            const activeCenterX = activeNodeRect.left + activeNodeRect.width / 2;
            for (let i = 0; i <= filteredChildren.length; i++) {
                let x, targetId, position;
                if (i === 0) {
                    x = blockNodesRef.current.get(filteredChildren[i].id)?.getBoundingClientRect().left;
                    targetId = filteredChildren[i].id;
                    position = 'left';
                } else if (i === filteredChildren.length) {
                    x = blockNodesRef.current.get(filteredChildren[i - 1].id)?.getBoundingClientRect().right;
                    targetId = filteredChildren[i - 1].id;
                    position = 'right';
                } else {
                    const leftRect = blockNodesRef.current.get(filteredChildren[i - 1].id)?.getBoundingClientRect();
                    const rightRect = blockNodesRef.current.get(filteredChildren[i].id)?.getBoundingClientRect();
                    if (!leftRect || !rightRect) continue;
                    x = leftRect.right + (rightRect.left - leftRect.right) / 2;
                    targetId = filteredChildren[i - 1].id;
                    position = 'right';
                }
                if (x === undefined) continue;
                const distance = Math.abs(activeCenterX - x);
                if (distance < closest.distance) {
                    closest = { distance, targetId, position };
                }
            }
        }

        if (!closest.targetId) return;

        const targetNode = blockNodesRef.current.get(closest.targetId);
        if (!targetNode) return;
        const targetRect = targetNode.getBoundingClientRect();
        const lineThickness = 4;
        let indicatorRect;

        if (closest.position === 'top') {
            indicatorRect = { top: targetRect.top - lineThickness / 2, left: targetRect.left, width: targetRect.width, height: lineThickness };
        } else if (closest.position === 'bottom') {
            indicatorRect = { top: targetRect.bottom - lineThickness / 2, left: targetRect.left, width: targetRect.width, height: lineThickness };
        } else if (closest.position === 'left') {
            indicatorRect = { left: targetRect.left - lineThickness / 2, top: targetRect.top, height: targetRect.height, width: lineThickness };
        } else { // 'right'
            indicatorRect = { left: targetRect.right - lineThickness / 2, top: targetRect.top, height: targetRect.height, width: lineThickness };
        }

        setDropIndicator({ rect: indicatorRect, ...closest, context: 'canvas' }); // <-- Добавляем контекст
    }, [blocks, actions]);

    const handleDragEnd = ({ active, over }) => {
        const indicator = dropIndicator; // Копируем состояние
        actions.setActiveId(null);
        setDropIndicator(null);

        if (!indicator || !over) return;

        // --- ЛОГИКА ЗАВЕРШЕНИЯ ДЛЯ ПАНЕЛИ СТРУКТУРЫ ---
        if (indicator.context === 'structure') {
            const activeId = active.data.current.blockId; // реальный ID блока
            let targetId = indicator.targetId;

            // Если цель - корень панели, используем специальный маркер
            if (targetId === 'structure-root') {
                targetId = 'root';
            }

            const { position } = indicator;

            // Нельзя бросать блок на самого себя
            if (activeId === targetId && position === 'inner') return;

            const newBlocks = moveBlock(blocks, activeId, targetId, position);

            if (newBlocks) {
                actions.setBlocks(newBlocks);
                actions.select(activeId); // Выделяем перемещенный блок для удобства
            }
            return; // Важно! Прерываем выполнение
        }

        // --- СТАРАЯ ЛОГИКА ЗАВЕРШЕНИЯ ДЛЯ КАНВАСА ---
        // Тут твой существующий код для handleDragEnd, который работает с канвасом
        const { position, targetId } = indicator;
        if (!position || !targetId) return;

        let blockToInsert;
        const activeData = active.data.current; // Получаем данные перетаскиваемого элемента
        console.log('Активный элемент:', active);

        // --- ВОТ ГЛАВНОЕ ИЗМЕНЕНИЕ ---

        if (activeData.isNew) {
            // Это НОВЫЙ элемент (блок или паттерн)
            if (activeData.isPattern) {
                // 1. ЭТО ПАТТЕРН
                // Глубоко клонируем его структуру и назначаем НОВЫЕ ID всем вложенным блокам.
                // Это критически важно, чтобы избежать дубликатов ID на странице.
                blockToInsert = deepCloneWithNewIds(activeData.content);
            } else {
                // 2. ЭТО ОБЫЧНЫЙ НОВЫЙ БЛОК
                const info = AVAILABLE_BLOCKS.find(b => b.type === activeData.type);
                if (!info) return;
                // Создаем блок по умолчанию, как и раньше
                blockToInsert = { id: nanoid(), ...info.defaultData() };
            }

            // Вставляем новый элемент. Исходный массив блоков не меняем.
            const newBlocks = insertBlockRecursive(blocks, targetId, blockToInsert, position);
            if (newBlocks) {
                actions.setBlocks(newBlocks);
                actions.select(blockToInsert.id); // Выделяем новый элемент
            }

        } else {
            // ЭТО СУЩЕСТВУЮЩИЙ элемент, который мы перемещаем
            blockToInsert = findBlockAndParent(blocks, active.id)?.block;
            if (!blockToInsert) return;

            // Сначала удаляем старый блок, потом вставляем в новое место
            const initialBlocks = removeBlockRecursive(blocks, active.id);
            const newBlocks = insertBlockRecursive(initialBlocks, targetId, blockToInsert, position);
            if (newBlocks) {
                actions.setBlocks(newBlocks);
                actions.select(blockToInsert.id); // Выделяем перемещенный блок
            }
        }
    };

    const handleDragCancel = () => {
        actions.setActiveId(null);
        setDropIndicator(null);
    };

    return {
        activeBlock,
        dropIndicator,
        handleDragStart,
        handleDragMove,
        handleDragEnd,
        handleDragCancel,
    };
};