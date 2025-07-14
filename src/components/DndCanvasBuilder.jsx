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
import { findBlockAndParent, generatePreviewLayout, insertBlockRecursive, isAncestor, removeBlockRecursive } from '../utils/blockUtils';
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
  const { blocks, selectedBlockId, activeId, focusRequest, actions } = useBlockManager();
  const [isLoading, setIsLoading] = useState(true);
  const [isNewPage, setIsNewPage] = useState(false);
  const [pageTitle, setPageTitle] = useState('Новая страница');
  const [mode, setMode] = useState(initialMode);

  const [activeLeftPanel, setActiveLeftPanel] = useState(null);
  const [panelContent, setPanelContent] = useState(null);
  const [isPropertiesPanelVisible, setPropertiesPanelVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const [dropIndicator, setDropIndicator] = useState(null);

  const blockNodesRef = useRef(new Map());

  const isEditMode = mode === 'edit';

  useEffect(() => {
    if (slug === 'new') {
      setIsNewPage(true);
      actions.setBlocks([]);
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
          ? `http://localhost:3001/pages/${slug}?mode=${mode}&version=${versionId}`
          : `http://localhost:3001/pages/${slug}?mode=${mode}`;

        const response = await fetch(apiUrl);
        if (!response.ok) {
          if (response.status === 404) setIsNewPage(true);
          throw new Error('Страница не найдена или ошибка сервера');
        }

        const { page, version } = await response.json();
        setIsNewPage(false);
        setPageTitle(page.title);

        let contentBlocks = [];
        if (version && version.content) {
          const initialParsed = typeof version.content === 'string'
            ? JSON.parse(version.content)
            : version.content;
          contentBlocks = deepParseBlocks(initialParsed);
        }
        actions.setBlocks(Array.isArray(contentBlocks) ? contentBlocks : []);
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
      const response = await fetch(`http://localhost:3001/pages`, {
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
      await response.json();
      alert(`Страница успешно создана!`);
      navigate(`/editor/${finalSlug}`, { replace: true });
    } catch (error) {
      console.error('Не удалось создать страницу:', error);
      alert('Произошла ошибка при создании страницы.');
    }
  };

  const handleCreateNewVersion = async () => {
    try {
      const response = await fetch(`http://localhost:3001/pages/${slug}/versions`, {
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
    } catch (error) {
      console.error('Не удалось сохранить страницу:', error);
      alert('Произошла ошибка при сохранении.');
    }
  };

  const handleSave = () => {
    if (isNewPage) {
      handleCreateNewPage();
    } else {
      handleCreateNewVersion();
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
  };

  const handleDragMove = useCallback((event) => {
    const { active, over } = event;
    setDropIndicator(null);

    if (!over || !active.rect.current.translated || active.id === over.id) {
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
      // Если у блока нет родителя, значит, контейнер - root
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


    // --- ШАГ 4: Логика индикатора ---
    const filteredChildren = children.filter(child => child.id !== active.id);
    const isEmpty = filteredChildren.length === 0;

    // --- Сценарий A: Контейнер пуст ---
    if (isEmpty) {
      setDropIndicator({
        rect: containerNode.getBoundingClientRect(),
        position: 'inner',
        targetId: container.id,
        isOverlay: true,
      });
      return;
    }

    // --- Сценарий B: Контейнер не пуст, ищем "щель" ---
    const activeNodeRect = active.rect.current.translated;
    let layoutDirection = 'column'; // Значение по умолчанию
    if (containerInfo && containerInfo.layoutDirection) {
      if (typeof containerInfo.layoutDirection === 'function') {
        // Для динамических контейнеров, например 'core/container'
        layoutDirection = containerInfo.layoutDirection(container);
      } else {
        // Для статических контейнеров, например 'core/columns'
        layoutDirection = containerInfo.layoutDirection;
      }
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

    // Рисуем индикатор
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

    setDropIndicator({ rect: indicatorRect, ...closest });

  }, [blocks]);

  const handleDragEnd = ({ active }) => {
    const { position, targetId } = dropIndicator || {};
    actions.setActiveId(null);
    setDropIndicator(null);
    if (!position || !targetId || !active.data.current) return;

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
      />
      <main className={styles.mainContent}>
        <AnimatePresence>
          {/* Видимость управляется `activeLeftPanel` */}
          {isEditMode && activeLeftPanel && (
            <motion.aside
              key={activeLeftPanel}
              className={styles.panelLeft}
              initial={{ width: 0, x: '-100%' }}
              animate={{ width: 280, x: 0 }}
              exit={{ width: 0, x: '-100%' }}
              transition={{ type: 'tween', ease: 'easeInOut', duration: 0.3 }}
            >
              <div className={styles.panelContentWrapper}>
                {/* А контент управляется `panelContent` */}
                {panelContent === 'elements' && <SidebarElements />}
                {panelContent === 'structure' && <StructurePanel blocks={blocks} onSelect={actions.select} selectedId={selectedBlockId} />}
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
              animate={{ width: 280, x: 0 }}
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
        {dropIndicator && ReactDOM.createPortal(
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