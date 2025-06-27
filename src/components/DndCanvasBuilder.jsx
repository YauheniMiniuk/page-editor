import React, { useMemo, useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { nanoid } from 'nanoid';

import styles from './DndCanvasBuilder.module.css';
import { BLOCK_TYPES, AVAILABLE_BLOCKS } from '../utils/constants';
import { findBlockAndParent, insertBlockRecursive, removeBlockRecursive } from '../utils/blockUtils';
import useBlockManagement from '../hooks/useBlockManagement';

import SidebarElements from './sidebar/SidebarElements';
import Canvas from './canvas/Canvas';
import PropertiesPanel from './panels/PropertiesPanel';
import StructurePanel from './panels/StructurePanel';
import DragOverlayContent from './common/DragOverlayContent';
import { useBlockManager } from '../contexts/BlockManagementContext';

export default function DndCanvasBuilder({ mode = 'edit' }) {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const versionId = searchParams.get('version');

  // Получаем состояние и единый объект `actions` из нашего хука
  const { blocks, selectedBlockId, activeId, actions } = useBlockManager();

  const [isLoading, setIsLoading] = useState(true);
  const [isNewPage, setIsNewPage] = useState(false);
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

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 1 } }));
  const selectedBlock = useMemo(() => findBlockAndParent(blocks, selectedBlockId)?.block || null, [blocks, selectedBlockId]);

  const handleDragStart = (event) => actions.setActiveId(event.active.id);
  const handleDragCancel = () => actions.setActiveId(null);

  const handleDragEnd = ({ active, over }) => {
    actions.setActiveId(null);
    if (!over) return;
    if (over.id.toString().includes(active.id)) return;

    const isSidebarItem = active.data.current?.isSidebarItem;
    const isCanvasItem = active.data.current?.isCanvasItem;
    let draggedBlock = null;
    let initialBlocks = [...blocks];

    if (isSidebarItem) {
      const info = AVAILABLE_BLOCKS.find(b => b.type === active.data.current.type);
      draggedBlock = { id: nanoid(), ...info.defaultData };
    } else if (isCanvasItem) {
      const findResult = findBlockAndParent(blocks, active.id);
      if (!findResult) return;
      draggedBlock = findResult.block;
      initialBlocks = removeBlockRecursive(blocks, active.id);
    } else {
      return;
    }

    const { targetId, position } = over.data.current || {};
    const newBlocks = insertBlockRecursive(initialBlocks, targetId || over.id, draggedBlock, position);
    actions.setBlocks(newBlocks);
  };

  const activeBlockForOverlay = useMemo(() => {
    if (!activeId) return null;
    if (String(activeId).startsWith('sidebar-')) {
      const type = String(activeId).replace('sidebar-', '');
      const blockInfo = AVAILABLE_BLOCKS.find(block => block.type === type);
      return blockInfo ? { type: blockInfo.type, content: `Новый ${blockInfo.label}` } : null;
    }
    const blockOnCanvas = findBlockAndParent(blocks, activeId)?.block;
    return blockOnCanvas ? { type: blockOnCanvas.type, content: blockOnCanvas.content } : null;
  }, [activeId, blocks]);

  if (isLoading) {
    return <div>Загрузка...</div>;
  }

  const builderContent = (
    <div className={styles.app}>
      {isEditMode && (
        <div className={styles.sidebar}>
          <h3>Элементы</h3>
          <SidebarElements />
          <button onClick={handleSave} className={styles.saveButton}>Сохранить</button>
        </div>
      )}
      <div className={styles.canvasContainer}>
        <Canvas
          className={styles.Canvas}
          mode={mode}
        />
      </div>
      {isEditMode && (
        <PropertiesPanel
          selectedBlock={selectedBlock}
          actions={actions}
        />
      )}
      {isEditMode && (
        <StructurePanel blocks={blocks} onSelect={actions.select} selectedId={selectedBlockId} />
      )}
    </div>
  );

  if (isEditMode) {
    return (
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={handleDragCancel}>
        {builderContent}
        <DragOverlay>
          {activeBlockForOverlay ? <DragOverlayContent block={activeBlockForOverlay} /> : null}
        </DragOverlay>
      </DndContext>
    );
  }

  return builderContent;
}