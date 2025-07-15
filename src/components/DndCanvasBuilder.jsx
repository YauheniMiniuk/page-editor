import React, { useMemo, useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router';
import ReactDOM from 'react-dom';
import { useLocation } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  pointerWithin,
  rectIntersection,
  closestCenter
} from '@dnd-kit/core';
import { nanoid } from 'nanoid';
import { AnimatePresence, motion } from 'framer-motion';
import { useDebouncedCallback } from 'use-debounce';

import styles from './DndCanvasBuilder.module.css';
import { BLOCK_TYPES, AVAILABLE_BLOCKS, BLOCK_COMPONENTS } from '../utils/constants';
import { findBlockAndParent, generatePreviewLayout, insertBlockRecursive, isAncestor, moveBlock, removeBlockRecursive } from '../utils/blockUtils';
import useBlockManagement from '../hooks/useBlockManagement';

import SidebarElements from './sidebar/SidebarElements';
import Canvas from './canvas/Canvas';
import PropertiesPanel from './panels/PropertiesPanel';
import StructurePanel from './panels/StructurePanel';
import DragOverlayContent from './common/DragOverlayContent';
import { useBlockManager } from '../contexts/BlockManagementContext';
import Header from './Header';
import { setCursorPosition } from '../utils/domUtils';
import indicatorStyles from './DropIndicator.module.css';
import classNames from 'classnames';

const portalRoot = document.getElementById('portal-root');
const PROXIMITY_THRESHOLD_RATIO = 0.6;

const DropIndicator = ({ rect, isOverlay }) => {
  // Явно задаем все стили, чтобы исключить влияние CSS-файлов
  const style = {
    position: 'fixed',
    zIndex: 10000,
    pointerEvents: 'none',
    transition: 'all 0.1s ease',

    // Геометрия из `rect`
    top: `${rect.top}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
  };

  // Стили для разных типов индикатора
  if (isOverlay) {
    style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
    style.border = '2px dashed #3b82f6';
    style.borderRadius = '4px';
  } else {
    style.backgroundColor = '#3b82f6';
    style.borderRadius = '2px';
  }

  return <div style={style} />;
};

/**
 * Модификатор, который заставляет верхний левый угол DragOverlay
 * следовать точно за курсором мыши.
 */
const snapTopLeftToCursor = ({ activatorEvent, activeNodeRect, transform }) => {
  if (activeNodeRect && activatorEvent) {
    // Вычисляем, каким должен быть итоговый сдвиг, чтобы левый верхний угол
    // оверлея оказался в позиции курсора.
    // Формула: НовыйСдвиг = ТекущийСдвиг + (НачальнаяПозицияКурсора - НачальнаяПозицияБлока)
    const newTransform = {
      ...transform,
      x: transform.x,
      y: transform.y,
    };
    return newTransform;
  }

  return transform;
};

export default function DndCanvasBuilder({ initialMode = 'edit' }) {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const versionId = searchParams.get('version');
  const location = useLocation();

  // Получаем состояние и единый объект `actions` из нашего хука
  const { blocks, selectedBlockId, activeId, focusRequest, actions, canUndo, canRedo } = useBlockManager();
  const [lastSavedBlocks, setLastSavedBlocks] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isNewPage, setIsNewPage] = useState(false);
  const [pageTitle, setPageTitle] = useState('Новая страница');
  const [mode, setMode] = useState(initialMode);

  const [pageStatus, setPageStatus] = useState({ isLive: false, isNewPage: false });

  const [activeLeftPanel, setActiveLeftPanel] = useState(null);
  const [panelContent, setPanelContent] = useState(null);
  const [isPropertiesPanelVisible, setPropertiesPanelVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const [dropIndicator, setDropIndicator] = useState(null);

  const blockNodesRef = useRef(new Map());
  const structureNodesRef = useRef(new Map());

  const isEditMode = mode === 'edit';

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

    const fetchPageData = async () => {
      setIsLoading(true);
      try {
        const apiUrl = versionId
          ? `/pages/${slug}?mode=${mode}&version=${versionId}`
          : `/pages/${slug}?mode=${mode}`;

        const response = await fetch(apiUrl);
        if (!response.ok) {
          if (response.status === 404) setIsNewPage(true);
          throw new Error('Страница не найдена или ошибка сервера');
        }

        const { page, version } = await response.json();
        setIsNewPage(false);
        setPageTitle(page.title);

        setPageStatus({
          isLive: page.live_version_id === version?.id,
          isNewPage: false,
        });

        let contentBlocks = [];
        if (version && version.content) {
          const initialParsed = typeof version.content === 'string'
            ? JSON.parse(version.content)
            : version.content;
          contentBlocks = deepParseBlocks(initialParsed);
        }
        const newInitialState = Array.isArray(contentBlocks) ? contentBlocks : [];
        actions.resetHistory(newInitialState); // ...мы сбрасываем историю на это состояние
        setLastSavedBlocks(newInitialState);
      } catch (error) {
        console.error("Ошибка загрузки страницы:", error.message);
        actions.setBlocks([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPageData();
  }, [slug, mode, versionId]);

  useEffect(() => {
    // Если в URL есть хэш (например, #section-qa9ixx)
    if (location.hash) {
      // Убираем #, чтобы получить чистый ID
      const id = location.hash.substring(1);

      // Даем React микро-паузу, чтобы он точно успел все отрисовать
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          // Если элемент найден, плавно скроллим к нему
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100); // Небольшая задержка для надежности
    }
    // Этот эффект будет срабатывать каждый раз, когда меняется URL
  }, [location]);

  const handleCreateNewPage = async () => {
    const title = prompt("Введите заголовок для новой страницы:");
    if (!title) return alert("Заголовок обязателен.");

    const finalSlug = (slug === 'new') ? prompt("Введите slug для URL:", title.toLowerCase().replace(/\s+/g, '-')) : slug;
    if (!finalSlug) return alert("Slug обязателен.");

    try {
      const response = await fetch(`/pages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: finalSlug,
          title: title,
          content: blocks,
          version_title: `Первая версия: ${title}`,
          analytics_round: new Date().toISOString().slice(0, 10),
        }),
      });
      if (!response.ok) throw new Error('Ошибка при создании страницы');
      const result = await response.json();
      console.log(result);
      alert(`Страница успешно создана!`);
      navigate(`/editor/${finalSlug}?version=${result.versionId}`, { replace: true });
      return true;
    } catch (error) {
      console.error('Не удалось создать страницу:', error);
      alert('Произошла ошибка при создании страницы.');
      return false;
    }
  };

  const handleCreateNewVersion = async () => {
    try {
      const response = await fetch(`/pages/${slug}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: blocks,
          version_title: `Обновление от ${new Date().toLocaleString()}`,
          analytics_round: new Date().toISOString().slice(0, 10),
        }),
      });
      if (!response.ok) throw new Error('Ошибка сохранения');
      const result = await response.json();
      alert(`Новый черновик сохранен! ID версии: ${result.versionId}`);
      navigate(`/editor/${slug}?version=${result.versionId}`, { replace: true });
      return true;
    } catch (error) {
      console.error('Не удалось сохранить страницу:', error);
      alert('Произошла ошибка при сохранении.');
      return false;
    }
  };

  const handleSave = () => {
    const saveAction = isNewPage ? handleCreateNewPage : handleCreateNewVersion;
    saveAction().then(success => {
      if (success) {
        setLastSavedBlocks(blocks);
      }
    });
  };

  const handlePublish = async () => {
    if (pageStatus.isNewPage || !slug || !versionId) {
      alert('Сначала сохраните страницу как черновик.');
      return;
    }

    if (window.confirm(`Опубликовать эту версию? Она станет видна всем пользователям.`)) {
      try {
        const response = await fetch(`/pages/${slug}/versions/${versionId}/publish`, {
          method: 'PUT',
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Ошибка публикации');
        }
        alert('Версия успешно опубликована!');
        // Обновляем статус в UI
        setPageStatus(prev => ({ ...prev, isLive: true }));
      } catch (error) {
        console.error('Не удалось опубликовать версию:', error);
        alert(`Ошибка: ${error.message}`);
      }
    }
  };

  const handleToggleMode = () => {
    setMode(prev => (prev === 'edit' ? 'view' : 'edit'));
  };

  const handleToggleLeftPanel = (panelName) => {
    if (isAnimating) return;
    const currentPanel = activeLeftPanel;

    if (currentPanel && currentPanel !== panelName) {
      setIsAnimating(true);
      // 1. Закрываем панель. `panelContent` остается прежним, чтобы
      // анимация закрытия прошла с правильным содержимым.
      setActiveLeftPanel(null);

      // 2. После анимации...
      setTimeout(() => {
        // ...сначала меняем контент...
        setPanelContent(panelName);
        // ...а потом открываем панель уже с новым контентом.
        setActiveLeftPanel(panelName);
        setIsAnimating(false);
      }, 300); // Должно совпадать с `duration` в `transition`
    } else {
      // Стандартное поведение: открыть/закрыть
      // Если открываем с нуля, нужно сначала установить контент
      if (!currentPanel) {
        setPanelContent(panelName);
      }
      setActiveLeftPanel(current => (current === panelName ? null : panelName));
    }
  };

  const handleTogglePropertiesPanel = () => {
    setPropertiesPanelVisible(prev => !prev);
  };

  const isDirty = useMemo(() => {
    // Если еще не загрузили данные, считаем, что изменений нет
    if (lastSavedBlocks === null) return false;
    // Сравниваем строковые представления состояний
    return JSON.stringify(blocks) !== JSON.stringify(lastSavedBlocks);
  }, [blocks, lastSavedBlocks]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey || event.metaKey) {
        // --- ИЗМЕНЕНИЯ ЗДЕСЬ ---
        if (event.code === 'KeyZ') { // Было: event.key === 'z'
          event.preventDefault();
          actions.undo();
        } else if (event.code === 'KeyY') { // Было: event.key === 'y'
          event.preventDefault();
          actions.redo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [actions]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 10 } }));
  const selectedBlock = useMemo(() => findBlockAndParent(blocks, selectedBlockId)?.block || null, [blocks, selectedBlockId]);

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
    actions.setOverDropZone(null);
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

    const activeContext = active.data.current?.context;
    const overContext = over.data.current?.context;

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
    if (activeContext === 'structure') return;

    if (!active.rect.current.translated) {
      return;
    }

    // --- ШАГ 1: Определяем перетаскиваемый блок и его правила ---
    const activeData = active.data.current;
    const draggedBlockType = activeData.isSidebarItem
      ? activeData.type
      : activeData.block.type;
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
    const isNewBlock = active.data.current.isSidebarItem;
    if (isNewBlock) {
      const info = AVAILABLE_BLOCKS.find(b => b.type === active.data.current.type);
      if (!info) return;
      blockToInsert = { id: nanoid(), ...info.defaultData() };
    } else {
      blockToInsert = findBlockAndParent(blocks, active.id)?.block;
    }
    if (!blockToInsert) return;

    const initialBlocks = isNewBlock ? blocks : removeBlockRecursive(blocks, active.id);
    const newBlocks = insertBlockRecursive(initialBlocks, targetId, blockToInsert, position);
    if (newBlocks) {
      actions.setBlocks(newBlocks);
      actions.select(blockToInsert.id);
    }
  };

  const handleDragCancel = () => {
    actions.setActiveId(null);
    setDropIndicator(null);
  };

  if (isLoading) {
    return <div>Загрузка...</div>;
  }

  const builderContent = (
    <div className={styles.builderLayout}>
      <Header
        isEditMode={isEditMode}
        onToggleMode={handleToggleMode}
        onSave={handleSave}
        pageTitle={pageTitle}
        activeLeftPanel={activeLeftPanel}
        onToggleLeftPanel={handleToggleLeftPanel}
        isPropertiesVisible={isPropertiesPanelVisible}
        onTogglePropertiesPanel={handleTogglePropertiesPanel}
        pageStatus={pageStatus}
        onPublish={handlePublish}
        isSaveDisabled={!isDirty}
        onUndo={actions.undo}
        onRedo={actions.redo}
        canUndo={canUndo}
        canRedo={canRedo}
      />
      <main className={styles.mainContent}>
        <AnimatePresence>
          {/* Видимость управляется `activeLeftPanel` */}
          {isEditMode && activeLeftPanel && (
            <motion.aside
              key={activeLeftPanel}
              className={styles.panelLeft}
              initial={{ width: 0, x: '-100%' }}
              animate={{ width: 320, x: 0 }}
              exit={{ width: 0, x: '-100%' }}
              transition={{ type: 'tween', ease: 'easeInOut', duration: 0.3 }}
            >
              <div className={styles.panelContentWrapper}>
                {/* А контент управляется `panelContent` */}
                {panelContent === 'elements' && <SidebarElements />}
                {panelContent === 'structure' && (
                  <StructurePanel
                    structureNodesRef={structureNodesRef}
                    dropIndicator={dropIndicator}
                  />
                )}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        <div className={styles.canvasContainer}>
          <Canvas mode={mode} blockNodesRef={blockNodesRef} />
        </div>

        <AnimatePresence>
          {isEditMode && isPropertiesPanelVisible && (
            <motion.aside
              key="right-panel"
              className={styles.panelRight}
              initial={{ width: 0, x: '100%' }}
              animate={{ width: 400, x: 0 }}
              exit={{ width: 0, x: '100%' }}
              transition={{ type: 'tween', ease: 'easeInOut', duration: 0.3 }}
            >
              <div className={styles.panelContentWrapper}>
                <PropertiesPanel selectedBlock={selectedBlock} actions={actions} />
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </main>
    </div>
  );

  if (isEditMode) {
    return (
      <DndContext
        sensors={sensors}
        collisionDetection={rectIntersection}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        {builderContent}

        <DragOverlay modifiers={[snapTopLeftToCursor]}>{activeBlock ? <DragOverlayContent block={activeBlock} /> : null}</DragOverlay>
        {dropIndicator && dropIndicator.rect && ReactDOM.createPortal(
          <DropIndicator
            rect={dropIndicator.rect}
            isOverlay={dropIndicator.position === 'inner'}
          />,
          portalRoot
        )}
      </DndContext>
    );
  }

  return builderContent;
}