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
  updateListItemContent,
  deepCloneWithNewIds
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

  const [patterns, setPatterns] = useState([]);
  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [focusRequest, setFocusRequest] = useState(null);
  const [isInlineEditing, setIsInlineEditing] = useState(false);
  const [copiedStyles, setCopiedStyles] = useState(null);
  const [activeMenu, setActiveMenu] = useState(null);
  const [mediaLibraryState, setMediaLibraryState] = useState({ isOpen: false, onSelect: null });
  const [isDesignModalOpen, setIsDesignModalOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const addPattern = useCallback((newPattern) => {
    setPatterns(prev => [...prev, newPattern]);
  }, []);

  const removePattern = useCallback((patternId) => {
    setPatterns(prev => prev.filter(p => p.id !== patternId));
  }, []);

  const actions = useMemo(() => ({
    // Функции, которые только обновляют состояние, не завися от него
    update: (id, props, options = {}) => {
      // Прокидываем опции в setState
      setBlocks(prev => updateBlockRecursive(prev, id, props), { debounce: options.debounce ? 500 : 0 });
    },
    add: (targetId, block, pos) => setBlocks(prev => insertBlockRecursive(prev, targetId, block, pos)),
    swap: (id, dir) => {
      setBlocks(prev => swapBlocksRecursive(prev, id, dir));
      setSelectedBlockId(id);
    },
    indentListItem: (id) => {
      setBlocks(prev => indentListItem(prev, id));
      setFocusRequest({ targetId: id, position: 'start' });
    },
    outdentListItem: (id) => {
      setBlocks(prev => outdentListItem(prev, id));
      setFocusRequest({ targetId: id, position: 'start' });
    },
    updateListItemContent: (id, content) => setBlocks(prev => updateListItemContent(prev, id, content)),
    replaceBlock: (blockId, newBlockObject) => {
      setBlocks(prev => prev.map(b => (b.id === blockId ? newBlockObject : b)));
    },
    duplicate: (id) => {
      setBlocks(prevBlocks => {
        const blockInfo = findBlockAndParent(prevBlocks, id);
        if (!blockInfo) return prevBlocks;

        const { block: blockToDuplicate } = blockInfo;
        // Клонируем блок с новыми ID
        const newBlock = deepCloneWithNewIds(blockToDuplicate);

        // Вставляем его сразу после оригинала
        return insertBlockRecursive(prevBlocks, id, newBlock, 'bottom');
      });
    },
    copyStyles: (id) => {
      const blockInfo = findBlockAndParent(blocks, id);
      if (blockInfo?.block) {
        // Копируем и стили, и варианты, так как они оба влияют на вид
        const stylesToCopy = {
          styles: blockInfo.block.styles,
          variants: blockInfo.block.variants,
        };
        setCopiedStyles(stylesToCopy);
        // Сюда можно добавить уведомление для пользователя, например, "Стили скопированы!"
      }
    },
    pasteStyles: (id) => {
      if (!copiedStyles) return; // Ничего не делаем, если буфер пуст
      // updateBlockRecursive уже умеет глубоко сливать объекты, что идеально нам подходит
      actions.update(id, copiedStyles);
    },
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
    selectSibling: (blockId, direction = 'next') => {
      const info = findBlockAndParent(blocks, blockId);
      if (!info) return;

      // Определяем, где искать соседей: в корне или в родительском блоке
      const siblings = info.parent ? info.parent.children : blocks;
      const newIndex = direction === 'up' ? info.index - 1 : info.index + 1;

      // Если новый индекс в пределах массива, выбираем соседа
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
    setBlocks,
    select: setSelectedBlockId,
    setActiveId,
    setInlineEditing: setIsInlineEditing,
    clearFocusRequest: () => setFocusRequest(null),
    setPatterns,
    addPattern,
    removePattern,
    openMenu: (menuId, data = {}) => {
      // menuId - уникальный ID меню (например, 'context-menu-xyz')
      // data - любые доп. данные (например, координаты {x, y})
      setActiveMenu({ id: menuId, data });
    },
    closeMenu: () => {
      setActiveMenu(null);
    },
    openMediaLibrary: (onSelectCallback) => {
      // Сохраняем колбэк, который будет вызван при выборе файла
      setMediaLibraryState({ isOpen: true, onSelect: onSelectCallback });
    },
    closeMediaLibrary: () => {
      setMediaLibraryState({ isOpen: false, onSelect: null });
    },
    addNotification: (message, type = 'success', duration = 3000) => {
      const id = Date.now();
      setNotifications(prev => [...prev, { id, message, type }]);

      // Убираем уведомление по таймеру, только если duration не null
      if (duration) {
        setTimeout(() => {
          setNotifications(prev => prev.filter(n => n.id !== id));
        }, duration);
      }
      return id; // Возвращаем ID, чтобы можно было удалить вручную
    },
    removeNotification: (id) => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    },
    openDesignModal: () => setIsDesignModalOpen(true),
    closeDesignModal: () => setIsDesignModalOpen(false),

  }), [selectedBlockId, setBlocks, undo, redo, copiedStyles, blocks]);

  return {
    blocks,
    selectedBlockId,
    activeId,
    isInlineEditing,
    focusRequest,
    copiedStyles,
    patterns,
    actions,
    canUndo,
    canRedo,
    activeMenu,
    mediaLibraryState,
    notifications,
    isDesignModalOpen,
  };
};

export default useBlockManagement;