// DndCanvasBuilder.js
import React, { useRef, useMemo, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useLocation } from 'react-router-dom';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, rectIntersection } from '@dnd-kit/core';
import { AnimatePresence, motion } from 'framer-motion';

// Наши новые хуки
import { usePageData } from '../hooks/usePageData';
import { usePanelManager } from '../hooks/usePanelManager';
import { usePatternManager } from '../hooks/usePatternManager';
import { useDragAndDrop } from '../hooks/useDragAndDrop';

// Контекст и компоненты
import { useBlockManager } from '../contexts/BlockManagementContext';
import Header from './Header';
import Canvas from './canvas/Canvas';
import PropertiesPanel from './panels/PropertiesPanel';
import StructurePanel from './panels/StructurePanel';
import ElementsAndPatternsPanel from './sidebar/ElementsAndPatternsPanel';
import DragOverlayContent from './common/DragOverlayContent';
import DropIndicator from './common/DropIndicator';
import styles from './DndCanvasBuilder.module.css';
import { useLayout } from '../contexts/LayoutContext';
import { CopyStylesIcon, DuplicateIcon, PasteStylesIcon } from '../utils/icons';
import { SaveIcon, Sparkles, TrashIcon } from 'lucide-react';
import ContextMenu from '../ui/ContextMenu';
import MediaLibrary from './media/MediaLibrary';
import Notifications from './common/Notification';
import DesignModal from './design/DesignModal';
import AiPromptModal from './common/AIPromptModal';
import GlobalStylesModal from './modals/GlobalStylesModal';
import DynamicStylesRenderer from './common/DynamicStylesRenderer';

const portalRoot = document.getElementById('portal-root');

export default function DndCanvasBuilder({ initialMode = 'edit' }) {
  const { headerRef } = useLayout();
  const location = useLocation();
  const { actions, canUndo, canRedo, selectedBlockId, blocks, activeMenu, copiedStyles, mediaLibraryState, isDesignModalOpen, notifications, isGenerating, aiModalState, isGlobalStylesModalOpen } = useBlockManager();

  const { isLoading, pageTitle, mode, setMode, pageStatus, handleSave, handlePublish, isDirty } = usePageData(initialMode);
  const { activeLeftPanel, panelContent, isPropertiesPanelVisible, handleToggleLeftPanel, handleTogglePropertiesPanel } = usePanelManager();
  const { patterns, handleSaveAsPattern, handleDeletePattern } = usePatternManager();

  const blockNodesRef = useRef(new Map());
  const structureNodesRef = useRef(new Map());
  const { activeBlock, dropIndicator, handleDragStart, handleDragMove, handleDragEnd, handleDragCancel } = useDragAndDrop(blockNodesRef, structureNodesRef);

  // 1. Проверяем, должно ли меню быть открыто
  const isContextMenuOpen = activeMenu?.id.startsWith('context-');

  // 2. Если да, извлекаем ID блока из ID меню
  const contextBlockId = isContextMenuOpen ? activeMenu.id.replace('context-', '') : null;

  // 3. Генерируем пункты меню на основе ID блока
  const menuItems = useMemo(() => {
    if (!contextBlockId) return [];

    // Эта функция теперь принимает ID блока, по которому кликнули
    const onSavePatternClick = () => {
      // Находим блок по ID и передаем его в функцию сохранения
      const { findBlockAndParent } = require('../utils/blockUtils');
      const { block: blockData } = findBlockAndParent(blocks, contextBlockId);
      if (blockData) {
        const patternName = prompt('Введите название для нового паттерна:');
        if (patternName) {
          handleSaveAsPattern(blockData, patternName);
        }
      }
    };

    return [
      { label: 'Дублировать', icon: <DuplicateIcon />, onClick: () => actions.duplicate(contextBlockId) },
      { label: 'Копировать стили', icon: <CopyStylesIcon />, onClick: () => actions.copyStyles(contextBlockId) },
      { label: 'Вставить стили', icon: <PasteStylesIcon />, onClick: () => actions.pasteStyles(contextBlockId), disabled: !copiedStyles },
      { isSeparator: true },
      { label: 'Сохранить как паттерн', icon: <SaveIcon />, onClick: onSavePatternClick },
      { isSeparator: true },
      {
        label: 'Сгенерировать с ИИ',
        icon: <Sparkles size={16} />,
        onClick: () => actions.openAiModal(contextBlockId)
      },
      { isSeparator: true },
      { label: 'Удалить', icon: <TrashIcon />, onClick: () => actions.delete(contextBlockId), isDestructive: true },
    ];
    // Обновляем зависимости useMemo
  }, [contextBlockId, actions, copiedStyles, blocks, handleSaveAsPattern]);

  // 1. Находим полный объект блока для передачи в модалку в качестве контекста
  const blockForAiModal = useMemo(() => {
    if (!aiModalState.isOpen || !aiModalState.blockId) return null;
    const { findBlockAndParent } = require('../utils/blockUtils');
    // findBlockAndParent вернет объект `{ block, parent, index }`
    // Нам нужен сам блок, который уже содержит всех своих детей
    return findBlockAndParent(blocks, aiModalState.blockId)?.block;
  }, [aiModalState, blocks]);

  // 2. Функция, которая будет вызвана при сабмите формы в модалке
  const handleAiSubmit = (prompt) => {
    if (!aiModalState.blockId) return;
    // Вызываем уже существующий action для генерации
    actions.restructureBlockWithAI(aiModalState.blockId, prompt);
    // Сразу закрываем модалку
    actions.closeAiModal();
  };

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 10 } }));
  const selectedBlock = useMemo(() => {
    const { findBlockAndParent } = require('../utils/blockUtils'); // Ленивый импорт
    return findBlockAndParent(blocks, selectedBlockId)?.block || null;
  }, [blocks, selectedBlockId]);

  useEffect(() => {
    // Логика скролла к якорю
    if (location.hash) {
      setTimeout(() => {
        const element = document.getElementById(location.hash.substring(1));
        if (element) element.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [location]);

  useEffect(() => {
    // Горячие клавиши
    const handleKeyDown = (event) => {
      const activeEl = document.activeElement;
      if (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable) {
        return;
      }

      if (event.key === 'Escape') {
        actions.select(null);
      }

      // Если блок не выбран, остальные клавиши не работают
      if (!selectedBlockId) return;

      const isCtrl = event.ctrlKey || event.metaKey;
      switch (event.key) {
        case 'Delete':
        case 'Backspace':
          event.preventDefault();
          actions.delete(selectedBlockId);
          break;

        case 'd':
          if (isCtrl) {
            event.preventDefault();
            actions.duplicate(selectedBlockId);
          }
          break;

        case 'ArrowUp':
          event.preventDefault();
          if (isCtrl) {
            actions.swap(selectedBlockId, 'up');
          } else {
            actions.selectSibling(selectedBlockId, 'up');
          }
          break;

        case 'ArrowDown':
          event.preventDefault();
          if (isCtrl) {
            actions.swap(selectedBlockId, 'down');
          } else {
            actions.selectSibling(selectedBlockId, 'down');
          }
          break;

        default:
          break;
      }

      if (event.ctrlKey || event.metaKey) {
        if (event.code === 'KeyZ') { event.preventDefault(); actions.undo(); }
        if (event.code === 'KeyY') { event.preventDefault(); actions.redo(); }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [actions]);

  if (isLoading) {
    return <div>Загрузка...</div>;
  }

  const isEditMode = mode === 'edit';

  // --- 3. Рендер ---
  const builderContent = (
    <div className={styles.builderLayout}>
      <Header
        ref={headerRef}
        isEditMode={isEditMode} onToggleMode={() => setMode(m => m === 'edit' ? 'view' : 'edit')}
        onSave={handleSave} isSaveDisabled={!isDirty}
        onPublish={handlePublish} pageStatus={pageStatus}
        pageTitle={pageTitle}
        activeLeftPanel={activeLeftPanel} onToggleLeftPanel={handleToggleLeftPanel}
        isPropertiesVisible={isPropertiesPanelVisible} onTogglePropertiesPanel={handleTogglePropertiesPanel}
        onUndo={actions.undo} onRedo={actions.redo} canUndo={canUndo} canRedo={canRedo}
      />
      <main className={styles.mainContent}>
        <AnimatePresence>
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
                {panelContent === 'elements' && <ElementsAndPatternsPanel patterns={patterns} onDeletePattern={handleDeletePattern} />}
                {panelContent === 'structure' && <StructurePanel structureNodesRef={structureNodesRef} dropIndicator={dropIndicator} onSaveAsPattern={handleSaveAsPattern} />}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        <div className={styles.canvasContainer}>
          <Canvas mode={mode} blockNodesRef={blockNodesRef} onSaveAsPattern={handleSaveAsPattern} />
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

        <DynamicStylesRenderer />
      </main>
    </div>
  );

  if (isEditMode) {
    return (
      <DndContext sensors={sensors} collisionDetection={rectIntersection} onDragStart={handleDragStart} onDragMove={handleDragMove} onDragEnd={handleDragEnd} onDragCancel={handleDragCancel}>
        {builderContent}
        <DragOverlay>{activeBlock ? <DragOverlayContent block={activeBlock} /> : null}</DragOverlay>
        {dropIndicator && dropIndicator.rect && ReactDOM.createPortal(<DropIndicator rect={dropIndicator.rect} isOverlay={dropIndicator.position === 'inner'} />, portalRoot)}
        <ContextMenu
          isOpen={isContextMenuOpen}
          items={menuItems}
          position={activeMenu?.data || { x: 0, y: 0 }}
          onClose={actions.closeMenu}
        />
        <MediaLibrary
          isOpen={mediaLibraryState.isOpen}
          onClose={actions.closeMediaLibrary}
          onSelect={mediaLibraryState.onSelect}
        />
        <DesignModal
          isOpen={isDesignModalOpen}
          onClose={actions.closeDesignModal}
        />
        <GlobalStylesModal
          isOpen={isGlobalStylesModalOpen}
          onClose={actions.closeGlobalStylesModal}
        />
        <AiPromptModal
          isOpen={aiModalState.isOpen}
          onClose={actions.closeAiModal}
          onSubmit={handleAiSubmit}
          blockContext={blockForAiModal}
          isGenerating={isGenerating}
        />

        <Notifications notifications={notifications} />
      </DndContext>
    );
  }

  return builderContent;
}