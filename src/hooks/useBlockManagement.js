import { useState, useCallback, useMemo } from 'react'; // Добавляем useMemo
import {
  removeBlockRecursive,
  updateBlockRecursive,
  insertBlockRecursive,
  findBlockAndParent,
  swapBlocksRecursive
} from '../utils/blockUtils';

const useBlockManagement = (initialBlocks = []) => {
  const [blocks, setBlocks] = useState(initialBlocks);
  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [activeDragItem, setActiveDragItem] = useState(null);
  const [overDropZone, setOverDropZone] = useState(null);

  // Все эти функции остаются без изменений.
  const handleDeleteBlock = useCallback((id) => {
    if (selectedBlockId === id) setSelectedBlockId(null);
    setBlocks(prev => removeBlockRecursive(prev, id));
  }, [selectedBlockId]);

  const handleUpdateBlock = useCallback((id, newProps) => {
    setBlocks(prev => updateBlockRecursive(prev, id, newProps));
  }, []);

  const handleAddBlock = useCallback((targetId, blockToInsert, position) => {
    setBlocks(prev => insertBlockRecursive(prev, targetId, blockToInsert, position));
  }, []);

  const handleSelectParent = useCallback((childId) => {
    console.log("Выбираем родительский блок");
    const info = findBlockAndParent(blocks, childId);
    if (info && info.parent) setSelectedBlockId(info.parent.id);
  }, [blocks]);

  const handleSelectSibling = useCallback((siblingId, direction = 'next') => {
    console.log("Выбираем ", direction, "блок");
    const info = findBlockAndParent(blocks, siblingId);
    if (!info) return;
    const siblings = info.parent ? info.parent.children : blocks;
    const newIndex = direction === 'next' ? info.index + 1 : info.index - 1;
    if (newIndex >= 0 && newIndex < siblings.length) {
      setSelectedBlockId(siblings[newIndex].id);
    }
  }, [blocks]);

  const swapBlock = useCallback((blockId, direction) => {
    setBlocks(prev => swapBlocksRecursive(prev, blockId, direction));
  }, []);

  const actions = useMemo(() => ({
    update: handleUpdateBlock,
    delete: handleDeleteBlock,
    add: handleAddBlock,
    select: setSelectedBlockId,
    selectParent: handleSelectParent,
    selectSibling: handleSelectSibling,
    setBlocks: setBlocks,
    setActiveId: setActiveId,
    swapBlock,
  }), [
    handleUpdateBlock, handleDeleteBlock, handleAddBlock,
    setSelectedBlockId, handleSelectParent, handleSelectSibling,
    setBlocks, setActiveId, swapBlock
  ]);

  return {
    blocks,
    selectedBlockId,
    activeId,
    activeDragItem,
    setActiveDragItem,
    overDropZone,
    setOverDropZone,
    actions,
  };
};

export default useBlockManagement;