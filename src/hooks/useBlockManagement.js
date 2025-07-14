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

const useBlockManagement = (initialBlocks = []) => {
  const [blocks, setBlocks] = useState(initialBlocks);
  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [activeDragItem, setActiveDragItem] = useState(null);
  const [overDropZone, setOverDropZone] = useState(null);
  const [focusRequest, setFocusRequest] = useState(null);
  const [isInlineEditing, setIsInlineEditing] = useState(false);

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

  const handleAddListItem = useCallback((currentItemId) => {
    const { newBlocks, newItemId } = addListItem(blocks, currentItemId);
    setBlocks(newBlocks);
    console.log(`🚀 ЗАПРОС ФОКУСА: Создан для нового элемента ${newItemId}`);
    setFocusRequest({ targetId: newItemId, position: 'start' });
  }, [blocks]);

  const handleRemoveListItem = useCallback((currentItemId) => {
    const { newBlocks, prevItemId } = removeListItem(blocks, currentItemId);
    setBlocks(newBlocks);
    if (prevItemId) {
      console.log(`🚀 ЗАПРОС ФОКУСА: Создан для предыдущего элемента ${prevItemId}`);
      setFocusRequest({ targetId: prevItemId, position: 'end' });
    }
  }, [blocks]);

  const handleIndentListItem = useCallback((currentItemId) => {
    setBlocks(prev => indentListItem(prev, currentItemId));
    console.log(`🚀 ЗАПРОС ФОКУСА: Создан для элемента ${currentItemId} после отступа`);
    setFocusRequest({ targetId: currentItemId, position: 'start' });
  }, []);

  const handleOutdentListItem = useCallback((currentItemId) => {
    setBlocks(prev => outdentListItem(prev, currentItemId));
    console.log(`🚀 ЗАПРОС ФОКУСА: Создан для элемента ${currentItemId} после отступа`);
    setFocusRequest({ targetId: currentItemId, position: 'start' });
  }, []);

  const handleUpdateListItemContent = useCallback((itemId, newContent) => {
    setBlocks(prev => updateListItemContent(prev, itemId, newContent));
  }, []);

  const handleTransformBlock = useCallback((blockId, newType) => {
    setBlocks(prev => transformBlock(prev, blockId, newType));
  }, []);

  const handleSetIsInlineEditing = useCallback((isEditing) => {
        console.log(`✍️ Режим inline-редактирования: ${isEditing ? 'ВКЛЮЧЕН' : 'ВЫКЛЮЧЕН'}`);
        setIsInlineEditing(isEditing);
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
    addListItem: handleAddListItem,
    indentListItem: handleIndentListItem,
    removeListItem: handleRemoveListItem,
    outdentListItem: handleOutdentListItem,
    updateListItemContent: handleUpdateListItemContent,
    transformBlock: handleTransformBlock,
    clearFocusRequest: () => {
      console.log("🔄 Сброс запроса на фокус");
      setFocusRequest(null)
    },
    setInlineEditing: handleSetIsInlineEditing,
    setOverDropZone,

  }), [
    handleUpdateBlock,
    handleDeleteBlock,
    handleAddBlock,
    setSelectedBlockId,
    handleSelectParent,
    handleSelectSibling,
    setBlocks,
    setActiveId,
    swapBlock,
    handleAddListItem,
    handleIndentListItem,
    handleRemoveListItem,
    handleOutdentListItem,
    handleTransformBlock,
    handleUpdateListItemContent,
    handleTransformBlock,
    setOverDropZone,
  ]);

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
  };
};

export default useBlockManagement;