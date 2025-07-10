import React, { useMemo, useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  pointerWithin,
  rectIntersection
} from '@dnd-kit/core';
import { nanoid } from 'nanoid';
import { AnimatePresence, motion } from 'framer-motion';
import { useDebouncedCallback } from 'use-debounce';

import styles from './DndCanvasBuilder.module.css';
import { BLOCK_TYPES, AVAILABLE_BLOCKS } from '../utils/constants';
import { findBlockAndParent, generatePreviewLayout, insertBlockRecursive, isAncestor, removeBlockRecursive } from '../utils/blockUtils';
import useBlockManagement from '../hooks/useBlockManagement';

import SidebarElements from './sidebar/SidebarElements';
import Canvas from './canvas/Canvas';
import PropertiesPanel from './panels/PropertiesPanel';
import StructurePanel from './panels/StructurePanel';
import DragOverlayContent from './common/DragOverlayContent';
import { useBlockManager } from '../contexts/BlockManagementContext';
import Header from './Header';

const DropIndicator = ({ indicator }) => {
    const style = {
        position: 'absolute',
        width: indicator.rect.width,
        height: '2px',
        background: '#3b82f6',
        left: indicator.rect.left,
        top: indicator.position === 'top' ? indicator.rect.top : indicator.rect.bottom,
        pointerEvents: 'none', // Важно, чтобы он не мешал событиям мыши
        zIndex: 10000,
    };
    return <div style={style} />;
};

export default function DndCanvasBuilder({ initialMode = 'edit' }) {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const versionId = searchParams.get('version');

  // Получаем состояние и единый объект `actions` из нашего хука
  const { blocks, selectedBlockId, activeId, activeDragItem, setActiveDragItem, setOverDropZone, actions } = useBlockManager();
  const [isLoading, setIsLoading] = useState(true);
  const [isNewPage, setIsNewPage] = useState(false);
  const [pageTitle, setPageTitle] = useState('Новая страница');
  const [mode, setMode] = useState(initialMode);

  const [activeLeftPanel, setActiveLeftPanel] = useState(null);
  const [panelContent, setPanelContent] = useState(null);
  const [isPropertiesPanelVisible, setPropertiesPanelVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

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

  const customCollisionDetection = useCallback((args) => {
    // Сначала ищем точное попадание под курсор
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length > 0) {
      return pointerCollisions;
    }
    // Если под курсором ничего нет, ищем ближайшее пересечение
    return rectIntersection(args);
  }, []);

  const handleDragStart = ({ active }) => {
    // В `active` есть вся нужная нам информация, включая `data`.
    // Просто сохраняем весь этот объект.
    setActiveDragItem(active);
    actions.setActiveId(active.id);
  };

  const handleDragCancel = useCallback(() => {
    setActiveDragItem(null);
    setOverDropZone(null);
    actions.setActiveId(null);
  }, [actions]);

  const handleDragOver = ({ over }) => {
    setOverDropZone(over);
  };

  const handleDragEnd = useCallback(({ active, over }) => {
    console.log('--- handleDragEnd: Начало ---');
    console.log('Active (перетаскиваемый элемент):', active);
    console.log('Over (зона сброса):', over);

    // Сразу сбрасываем состояние, если перетаскивание отменено или брошено в пустоту
    if (!over) {
      console.log('🚫 Отмена: Перетаскивание завершилось без цели (over is null). Сброс состояний.');
      setActiveDragItem(null);
      setOverDropZone(null);
      actions.setActiveId(null);
      console.log('--- handleDragEnd: Конец (без цели) ---');
      return;
    }

    const activeData = active.data.current;
    const overData = over.data.current;

    console.log('Данные перетаскиваемого элемента (activeData):', activeData);
    console.log('Данные зоны сброса (overData):', overData);

    // --- УСИЛЕННЫЙ ЗАЩИТНЫЙ МЕХАНИЗМ ---
    // Явно проверяем, что ID перетаскиваемого БЛОКА не совпадает с ID ЦЕЛИ.
    if (activeData?.block?.id === overData?.targetId) {
      console.warn('🛡️ Защита: Попытка сбросить блок на самого себя заблокирована. ID блока:', activeData?.block?.id);
      setActiveDragItem(null);
      setOverDropZone(null);
      actions.setActiveId(null);
      console.log('--- handleDragEnd: Конец (сброс на себя) ---');
      return; // <-- Выходим, если пытаемся бросить блок на него же
    }

    // --- ОСНОВНАЯ ЛОГИКА ---
    if (overData?.targetId) {
      console.log('✅ Основная логика: Обнаружен targetId:', overData.targetId);

      const isDropFromSidebar = activeData?.context === 'sidebar' && (overData?.context === 'canvas' || overData?.context === 'structure');
      const isReorderingInSameContext = activeData?.context !== 'sidebar' && activeData?.context === overData?.context;

      console.log('Проверка контекста:');
      console.log(`  - Сброс из сайдбара? -> ${isDropFromSidebar}`);
      console.log(`  - Пересортировка в том же контексте? -> ${isReorderingInSameContext}`);

      if (isDropFromSidebar || isReorderingInSameContext) {
        console.log('👍 Условие выполнено: Либо сброс из сайдбара, либо пересортировка.');

        const draggedBlock = activeData.block;
        const activeBlockId = draggedBlock?.id;
        const targetId = overData.targetId;
        const position = overData.position || overData.calculatedPosition;

        console.log('Параметры для перемещения:');
        console.log('  - Перетаскиваемый блок (draggedBlock):', draggedBlock);
        console.log('  - ID перетаскиваемого блока (activeBlockId):', activeBlockId);
        console.log('  - ID цели (targetId):', targetId);
        console.log('  - Позиция вставки (position):', position);

        // Эта проверка остается как второй уровень защиты
        if (activeBlockId !== targetId) {
          console.log('🛡️ Пройдена вторая проверка на само-сброс.');
          let initialBlocks = [...blocks];
          let blockToInsert = draggedBlock;

          if (activeData.isSidebarItem) {
            console.log('➡️ Логика для сайдбара: Создание нового блока.');
            const info = AVAILABLE_BLOCKS.find(b => b.type === activeData.type);
            if (info) {
              blockToInsert = { id: nanoid(), ...info.defaultData };
              console.log('Создан новый блок для вставки:', blockToInsert);
            } else {
              console.error('Не удалось найти информацию о блоке для типа:', activeData.type);
              blockToInsert = null;
            }
          } else if (activeData.isCanvasItem || activeData.isStructureItem) {
            console.log('🔄 Логика для канваса/структуры: Перемещение существующего блока.');
            // Проверка на перемещение контейнера в самого себя
            if (draggedBlock.type === 'core/container') {
              const isMovingIntoDescendant = isAncestor(blocks, activeBlockId, targetId);
              console.log(`Проверка предка: Является ли цель (${targetId}) потомком источника (${activeBlockId})? -> ${isMovingIntoDescendant}`);
              if (isMovingIntoDescendant) {
                console.warn("Действие заблокировано: нельзя переместить контейнер в его потомка.");
                // Важно сбросить состояния и выйти
                setActiveDragItem(null);
                setOverDropZone(null);
                actions.setActiveId(null);
                console.log('--- handleDragEnd: Конец (предотвращено перемещение в потомка) ---');
                return;
              }
            }
            console.log('Удаляем блок из его старой позиции. ID для удаления:', activeBlockId);
            initialBlocks = removeBlockRecursive(blocks, activeBlockId);
            console.log('Структура блоков после удаления:', initialBlocks);
          }

          if (blockToInsert) {
            console.log('Вставляем блок в новую позицию...');
            const newBlocks = insertBlockRecursive(initialBlocks, targetId, blockToInsert, position);
            console.log('✅ Новая структура блоков (newBlocks):', newBlocks);
            actions.setBlocks(newBlocks);
            console.log('Действие setBlocks вызвано.');
          } else {
            console.warn('Нет блока для вставки (blockToInsert is null). Операция прервана.');
          }
        } else {
          console.warn('🛡️ Сработала вторая проверка на само-сброс. ID совпадают:', activeBlockId);
        }
      } else {
        console.log('❌ Условие не выполнено. Контексты несовместимы. Действий не требуется.');
      }
    } else {
      console.log('ℹ️ Нет targetId в overData. Никаких действий с блоками не выполняется.');
    }

    // Сбрасываем все временные состояния в любом случае
    console.log('🔄 Финальный сброс состояний (activeDragItem, overDropZone, activeId).');
    setActiveDragItem(null);
    setOverDropZone(null);
    actions.setActiveId(null);
    console.log('--- handleDragEnd: Конец ---');
  }, [blocks, actions, setActiveDragItem, setOverDropZone]);

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
        collisionDetection={customCollisionDetection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        {builderContent}
        <DragOverlay>
          {activeDragItem ? <DragOverlayContent block={activeDragItem.data.current.block} /> : null}
        </DragOverlay>
      </DndContext>
    );
  }

  return builderContent;
}