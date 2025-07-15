import { useState, useCallback, useMemo } from 'react'; // Добавляем useMemo
import {
  removeBlockRecursive,
  updateBlockRecursive,
  insertBlockRecursive,
  findBlockAndParent,
  swapBlocksRecursive,
  addListItem,
  indentListItem,
  removeListItem,
  outdentListItem,
  transformBlock,
  updateListItemContent
} from '../utils/blockUtils';
import { useHistory } from './useHistory';

const useBlockManagement = (initialBlocks = []) => {
  const {
    state: blocks,
    setState: setBlocks,
    undo,
    redo,
    resetHistory,
    canUndo,
    canRedo
  } = useHistory(initialBlocks);

  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [activeDragItem, setActiveDragItem] = useState(null);
  const [overDropZone, setOverDropZone] = useState(null);
  const [focusRequest, setFocusRequest] = useState(null);
  const [isInlineEditing, setIsInlineEditing] = useState(false);

  const actions = useMemo(() => ({
    // Функции, которые только обновляют состояние, не завися от него
    update: (id, props) => setBlocks(prev => updateBlockRecursive(prev, id, props)),
    add: (targetId, block, pos) => setBlocks(prev => insertBlockRecursive(prev, targetId, block, pos)),
    swap: (id, dir) => setBlocks(prev => swapBlocksRecursive(prev, id, dir)),
    indentListItem: (id) => {
      setBlocks(prev => indentListItem(prev, id));
      setFocusRequest({ targetId: id, position: 'start' });
    },
    outdentListItem: (id) => {
      setBlocks(prev => outdentListItem(prev, id));
      setFocusRequest({ targetId: id, position: 'start' });
    },
    updateListItemContent: (id, content) => setBlocks(prev => updateListItemContent(prev, id, content)),
    transformBlock: (id, newType) => setBlocks(prev => transformBlock(prev, id, newType)),

    // Функции, которые зависят от текущего состояния (blocks, selectedBlockId)
    delete: (id) => {
      // Зависит от selectedBlockId
      if (selectedBlockId === id) setSelectedBlockId(null);
      setBlocks(prev => removeBlockRecursive(prev, id));
    },
    selectParent: (childId) => {
      // Зависит от blocks
      const info = findBlockAndParent(blocks, childId);
      if (info?.parent) setSelectedBlockId(info.parent.id);
    },
    selectSibling: (siblingId, direction = 'next') => {
      // Зависит от blocks
      const info = findBlockAndParent(blocks, siblingId);
      if (!info) return;
      const siblings = info.parent ? info.parent.children : blocks;
      const newIndex = direction === 'next' ? info.index + 1 : info.index - 1;
      if (newIndex >= 0 && newIndex < siblings.length) {
        setSelectedBlockId(siblings[newIndex].id);
      }
    },
    addListItem: (currentItemId) => {
      // Зависит от blocks
      const { newBlocks, newItemId } = addListItem(blocks, currentItemId);
      setBlocks(newBlocks);
      setFocusRequest({ targetId: newItemId, position: 'start' });
    },
    removeListItem: (currentItemId) => {
      // Зависит от blocks
      const { newBlocks, prevItemId } = removeListItem(blocks, currentItemId);
      setBlocks(newBlocks);
      if (prevItemId) {
        setFocusRequest({ targetId: prevItemId, position: 'end' });
      }
    },
    undo,
    redo,
    resetHistory,
    // Прямая передача сеттеров
    setBlocks,
    select: setSelectedBlockId,
    setActiveId,
    setInlineEditing: setIsInlineEditing,

    // Простые функции без зависимостей
    clearFocusRequest: () => setFocusRequest(null),
    setOverDropZone

  }), [selectedBlockId, setBlocks, undo, redo]);

  return {
    blocks,
    selectedBlockId,
    activeId,
    activeDragItem,
    setActiveDragItem,
    overDropZone,
    focusRequest,
    isInlineEditing,
    actions,
    canUndo,
    canRedo,
  };
};

export default useBlockManagement;