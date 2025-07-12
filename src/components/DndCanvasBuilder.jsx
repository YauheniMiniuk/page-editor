import React, { useMemo, useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router';
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

const DropIndicator = ({ rect, isOverlay }) => {
  const style = {
    position: 'absolute',
    zIndex: 10000,
    pointerEvents: 'none',
    // Если это обводка, рисуем рамку. Если линия - сплошной фон.
    ...(isOverlay
      ? { border: '2px dashed #3b82f6', borderRadius: '4px' }
      : { backgroundColor: '#3b82f6', borderRadius: '2px' }
    ),
    // Применяем геометрию
    ...rect,
  };
  return <div style={style} />;
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

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const selectedBlock = useMemo(() => findBlockAndParent(blocks, selectedBlockId)?.block || null, [blocks, selectedBlockId]);

  const activeBlock = useMemo(() => {
    if (!activeId) return null;
    // Находим перетаскиваемый блок по его ID
    const data = findBlockAndParent(blocks, activeId);
    return data ? data.block : null;
  }, [activeId, blocks]);

  const handleDragStart = ({ active }) => {
    actions.setActiveId(active.id);
    // Не нужно сохранять весь active, достаточно id
  };

  const handleDragOver = (event) => {
    const { active, over } = event;

    // Используем 'over' напрямую. Это надежнее и проще.
    if (!over || active.id === over.id) {
      setDropIndicator(null);
      return;
    }

    // --- КЛЮЧЕВОЙ ФИКС ---
    // Добавляем защитную проверку на over.rect, чтобы избежать ошибки.
    const overRect = over.rect;
    if (!overRect) {
      setDropIndicator(null);
      return;
    }

    const overId = over.id;
    let overData = over.data.current;

    // Обработка корневой дроп-зоны
    if (overId === 'canvas-root-dropzone') {
      if (blocks.length > 0) {
        setDropIndicator(null);
        return;
      }
      // Если холст пуст, создаем "виртуальные" данные для корневой зоны
      overData = { isContainer: true, parentDirection: 'column' };
    }

    const isContainer = overData.isContainer;
    const isHorizontal = overData.parentDirection === 'row';
    const edgeThreshold = 0.25;

    const relativeY = (event.clientY - overRect.top) / overRect.height;
    const relativeX = (event.clientX - overRect.left) / overRect.width;

    let position = null;
    let indicatorRect = null;

    // Приоритет 1: Края
    if (isHorizontal) {
      if (relativeX < edgeThreshold) position = 'left';
      else if (relativeX > (1 - edgeThreshold)) position = 'right';
    } else {
      if (relativeY < edgeThreshold) position = 'top';
      else if (relativeY > (1 - edgeThreshold)) position = 'bottom';
    }

    // Приоритет 2: Центр контейнера
    if (position === null && isContainer) {
      position = 'inner';
    }

    // Приоритет 3: Центр обычного блока
    if (position === null) {
      if (isHorizontal) {
        position = relativeX < 0.5 ? 'left' : 'right';
      } else {
        position = relativeY < 0.5 ? 'top' : 'bottom';
      }
    }

    // Вычисляем геометрию индикатора
    switch (position) {
      case 'top':
        indicatorRect = { top: overRect.top - 2, left: overRect.left, width: overRect.width, height: 4 };
        break;
      case 'bottom':
        indicatorRect = { top: overRect.bottom - 2, left: overRect.left, width: overRect.width, height: 4 };
        break;
      case 'left':
        indicatorRect = { top: overRect.top, left: overRect.left - 2, width: 4, height: overRect.height };
        break;
      case 'right':
        indicatorRect = { top: overRect.top, left: overRect.right - 2, width: 4, height: overRect.height };
        break;
      case 'inner':
        indicatorRect = overRect;
        break;
    }

    if (indicatorRect) {
      const targetId = overId === 'canvas-root-dropzone' ? 'root' : overId;
      setDropIndicator({ rect: indicatorRect, position, targetId });
    } else {
      setDropIndicator(null);
    }
  };

  const handleDragEnd = ({ active, over }) => {
    // Получаем данные для вставки из состояния индикатора, а не из `over`
    const position = dropIndicator?.position;
    const targetId = dropIndicator?.targetId;

    // Сбрасываем состояния в любом случае
    actions.setActiveId(null);
    setDropIndicator(null);

    if (!position || !targetId || !active) {
      return;
    }

    // --- Твоя логика вставки, но с данными из индикатора ---
    const activeData = active.data.current;

    // --- НОВАЯ ЛОГИКА ОПРЕДЕЛЕНИЯ БЛОКА ---
    let draggedBlock;

    if (activeData.isSidebarItem) {
      // Если тащим НОВЫЙ блок из сайдбара, создаем его объект из шаблона
      const info = AVAILABLE_BLOCKS.find(b => b.type === activeData.type);
      if (!info) {
        console.error(`❌ ПРЕРЫВАНИЕ: Не найдена информация для блока типа "${activeData.type}" из сайдбара.`);
        return;
      }
      // Это временный объект, который нужен только для валидации
      draggedBlock = info.defaultData();
    } else {
      // Если тащим СУЩЕСТВУЮЩИЙ блок с холста
      draggedBlock = activeData.block;
    }

    // Теперь основная проверка
    if (!draggedBlock) {
      console.error("❌ ПРЕРЫВАНИЕ: Не удалось определить перетаскиваемый блок.");
      return;
    }
    // --- КОНЕЦ НОВОЙ ЛОГИКИ ---


    // --- ВАЛИДАТОР (остается без изменений, но теперь он будет работать) ---
    console.clear();
    console.log("--- 🏁 СТАРТ ВАЛИДАЦИИ DND ---");
    console.log(`➡️ Перетаскиваем блок: %c${draggedBlock.type}`, "color: blue; font-weight: bold;");

    const targetInfo = findBlockAndParent(blocks, targetId);
    // ... остальной код валидации с логами ...
    const targetParent = (position === 'inner') ? targetInfo?.block : targetInfo?.parent;
    console.log(`🎯 Целевой родитель (targetParent):`, targetParent ? `${targetParent.type} (id: ${targetParent.id})` : "null (Корень редактора)");

    const { blockInfo: draggedBlockInfo } = BLOCK_COMPONENTS[draggedBlock.type] || {};

    if (draggedBlockInfo?.parent) {
      console.log(`🔎 Правило для перетаскиваемого блока: должен находиться внутри [${draggedBlockInfo.parent.join(', ')}]`);
      const targetParentType = targetParent ? targetParent.type : null;
      if (!draggedBlockInfo.parent.includes(targetParentType)) {
        console.error(`❌ ПРЕРЫВАНИЕ (Правило 1): Тип родителя "${targetParentType}" не входит в список разрешенных [${draggedBlockInfo.parent.join(', ')}].`);
        return;
      }
      console.log("✅ Проверка 1 пройдена.");
    } else {
      console.log("ℹ️ У перетаскиваемого блока нет правил для родителя.");
    }

    if (targetParent) {
      const { blockInfo: targetParentInfo } = BLOCK_COMPONENTS[targetParent.type] || {};
      if (targetParentInfo?.allowedBlocks) {
        console.log(`🔎 Правило для родителя "${targetParent.type}": разрешает только [${targetParentInfo.allowedBlocks.join(', ')}]`);
        if (!targetParentInfo.allowedBlocks.includes(draggedBlock.type)) {
          console.error(`❌ ПРЕРЫВАНИЕ (Правило 2): Родитель не разрешает вставлять в себя "${draggedBlock.type}".`);
          return;
        }
        console.log("✅ Проверка 2 пройдена.");
      } else {
        console.log(`ℹ️ У родителя "${targetParent.type}" нет правил для дочерних элементов.`);
      }
    } else {
      console.log("ℹ️ Нет родителя, проверка дочерних правил не требуется.");
    }

    console.log("✅ ВАЛИДАЦИЯ ПРОЙДЕНА! Начинаем вставку блока.");
    // --- КОНЕЦ ВАЛИДАТОРА ---

    // Проверка на перетаскивание в самого себя или своего потомка
    if (isAncestor(blocks, active.id, targetId)) {
      console.warn("Действие заблокировано: нельзя переместить контейнер в его потомка.");
      return;
    }

    let blockToInsert;
    let initialBlocks = blocks;

    if (activeData.isSidebarItem) {
      const info = AVAILABLE_BLOCKS.find(b => b.type === activeData.type);
      blockToInsert = { id: nanoid(), ...info.defaultData() };
    } else {
      blockToInsert = draggedBlock;
      initialBlocks = removeBlockRecursive(blocks, active.id);
    }

    if (blockToInsert) {
      const newBlocks = insertBlockRecursive(initialBlocks, targetId, blockToInsert, position);
      actions.setBlocks(newBlocks);
    }
  };

  const handleDragCancel = () => {
    actions.setActiveId(null);
    setDropIndicator(null);
  };

  const collisionDetectionStrategy = (args) => {
    return closestCenter(args);
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
          <Canvas mode={mode} />
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
        collisionDetection={collisionDetectionStrategy}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        {builderContent}

        <DragOverlay>{activeBlock ? <DragOverlayContent block={activeBlock} /> : null}</DragOverlay>

        {dropIndicator && (
          <DropIndicator
            rect={dropIndicator.rect}
            isOverlay={dropIndicator.position === 'inner'}
          />
        )}
      </DndContext>
    );
  }

  return builderContent;
}