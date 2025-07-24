import { nanoid } from "nanoid";

export const isAncestor = (blocks, potentialAncestorId, childId) => {
  const childInfo = findBlockAndParent(blocks, childId);
  if (!childInfo || !childInfo.parent) return false;
  if (childInfo.parent.id === potentialAncestorId) return true;
  return isAncestor(blocks, potentialAncestorId, childInfo.parent.id);
};

export const findBlockAndParent = (blocks, id, parent = null) => {
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    if (block.id === id) {
      return { block, parent, index: i };
    }
    if (block.children && Array.isArray(block.children)) {
      const found = findBlockAndParent(block.children, id, block);
      if (found) return found;
    }
  }
  return null;
};

/**
 * Рекурсивно ищет родительский блок для элемента с заданным ID.
 *
 * @param {Array} blocks - Массив блоков для поиска (структура с 'id' и 'children').
 * @param {string} childId - ID дочернего элемента, родителя которого нужно найти.
 * @returns {object|null} - Родительский блок или null, если родитель не найден.
 */
export const findParentBlock = (blocks, childId) => {
  // Проходим по каждому блоку на текущем уровне вложенности.
  for (const block of blocks) {
    // Если у блока есть дочерние элементы, проверяем их.
    if (block.children && block.children.length > 0) {
      // Ищем среди прямых потомков.
      const isDirectParent = block.children.some(child => child.id === childId);
      if (isDirectParent) {
        // Если нашли, то текущий блок - искомый родитель.
        return block;
      }

      // Если среди прямых потомков не нашли, уходим вглубь рекурсии.
      const foundParent = findParentBlock(block.children, childId);
      if (foundParent) {
        // Если родитель нашелся на более глубоком уровне, возвращаем его наверх.
        return foundParent;
      }
    }
  }

  // Если прошли все блоки на всех уровнях и ничего не нашли.
  return null;
}

function findListItemPathRecursive(items, targetId, path = []) {
  for (const item of items) {
    const currentPath = [...path, item];
    if (item.id === targetId) return currentPath;

    const nestedList = item.children?.find(c => c.type === 'core/list');
    if (nestedList) {
      const foundPath = findListItemPathRecursive(nestedList.children, targetId, currentPath);
      if (foundPath) return foundPath;
    }
  }
  return null;
}

/**
 * Рекурсивно находит в любом дереве блоков элемент и его родительский массив.
 * @param {Array} blocks - Массив для поиска.
 * @param {string} targetId - ID искомого элемента.
 * @returns {{item: object, parentArray: Array}|null}
 */
const findItemAndParentArrayRecursive = (blocks, targetId) => {
  for (const block of blocks) {
    if (block.id === targetId) {
      return { item: block, parentArray: blocks };
    }
    if (block.children?.length) {
      const found = findItemAndParentArrayRecursive(block.children, targetId);
      if (found) return found;
    }
  }
  return null;
};

/**
 * Находит путь к элементу списка в виде массива объектов-предков.
 */
export function findBlockPath(blocks, targetId, path = []) {
  for (const block of blocks) {
    const currentPath = [...path, block];
    if (block.id === targetId) {
      return currentPath;
    }
    if (block.children?.length) {
      const foundPath = findBlockPath(block.children, targetId, currentPath);
      if (foundPath) return foundPath;
    }
  }
  return null;
}

const rebuildTree = (items, path, updateFn) => {
  if (!path || path.length === 0) return items;

  const [currentItem, ...restOfPath] = path;

  return items.map(item => {
    if (item.id !== currentItem.id) return item;

    if (restOfPath.length === 0) {
      // Мы достигли цели, применяем функцию
      return updateFn(item);
    }

    return {
      ...item,
      children: rebuildTree(item.children || [], restOfPath, updateFn)
    };
  });
};

export const insertBlockRecursive = (currentBlocks, targetId, blockToInsert, position) => {
  // Используем глубокое копирование, чтобы избежать мутаций исходного состояния. Это правильно.
  let blocksCopy = JSON.parse(JSON.stringify(currentBlocks));

  // ==================================================================
  // --- ВОТ ОНО, ИСПРАВЛЕНИЕ ---
  // Проверяем на 'root', который приходит из data дроп-зоны пустого канваса.
  if (targetId === 'root') {
    // Если цель - это корень (пустой канвас), просто добавляем блок в массив.
    blocksCopy.push(blockToInsert);
    return blocksCopy;
  }
  // ==================================================================

  const targetInfo = findBlockAndParent(blocksCopy, targetId);
  if (!targetInfo) {
    console.warn(`Целевой блок с ID "${targetId}" не найден. Вставка отменена.`);
    return currentBlocks; // Возвращаем исходный массив, если цель не найдена
  }
  const { block: targetBlock, parent: targetParent } = targetInfo;

  // Вставка внутрь контейнера
  // P.S. В будущем можно заменить `targetBlock.type === BLOCK_TYPES.CONTAINER`
  // на проверку флага `isContainer` для большей гибкости.
  if (position === 'inner') {
    if (!targetBlock.children) {
      targetBlock.children = [];
    }
    targetBlock.children.push(blockToInsert);
    return blocksCopy;
  }

  // Вставка до/после целевого блока (на том же уровне)
  const arrayToModify = targetParent ? targetParent.children : blocksCopy;
  const targetIndex = arrayToModify.findIndex(b => b.id === targetId);

  // Определяем индекс для вставки: после целевого блока или до него
  const insertIdx = (position === 'bottom' || position === 'right')
    ? targetIndex + 1
    : targetIndex;

  // Вставляем элемент в массив
  arrayToModify.splice(insertIdx, 0, blockToInsert);

  // Если был родитель, возвращаем всю структуру.
  // Если нет, значит мы меняли корневой массив, его и возвращаем.
  return targetParent ? blocksCopy : arrayToModify;
};

export const removeBlockRecursive = (blocks, id) => {
  const newBlocks = [];
  for (const b of blocks) {
    if (b.id === id) continue; // Просто пропускаем удаляемый блок

    if (b.children && Array.isArray(b.children)) {
      // Рекурсивно удаляем из дочерних и создаем новый объект блока
      newBlocks.push({ ...b, children: removeBlockRecursive(b.children, id) });
    } else {
      newBlocks.push(b);
    }
  }
  return newBlocks;
};

export const updateBlockRecursive = (blocks, id, newProps) => {
  return blocks.map(b => {
    // Если это не тот блок, ищем в дочерних
    if (b.id !== id) {
      if (b.children?.length) { // Проверяем наличие детей
        return { ...b, children: updateBlockRecursive(b.children, id, newProps) };
      }
      return b;
    }
    return {
      ...b,
      ...newProps, // Сначала применяем верхнеуровневые изменения (например, `content`)
      // А теперь мёржим вложенные объекты
      props: { ...b.props, ...newProps.props },
      variants: { ...b.variants, ...newProps.variants },
      styles: { ...b.styles, ...newProps.styles },
    };
  });
};

export function generatePreviewLayout({ blocks, activeBlock, overData, isSidebarItem }) {
  const { targetId, position } = overData || {};
  if (!targetId) return null;

  // Создаем копию блока-призрака
  const previewBlock = { ...activeBlock, id: `preview-${activeBlock.id}`, isPreview: true };

  // Сначала удаляем оригинал, если он уже есть на холсте
  const initialBlocks = isSidebarItem ? blocks : removeBlockRecursive(blocks, activeBlock.id);

  // Затем вставляем призрак
  return insertBlockRecursive(initialBlocks, targetId, previewBlock, position);
}

export const swapBlocksRecursive = (blocks, blockId, direction) => {
  const blocksCopy = JSON.parse(JSON.stringify(blocks));
  const parentInfo = findBlockAndParent(blocksCopy, blockId);

  if (!parentInfo) return blocks; // Блок не найден

  const siblings = parentInfo.parent ? parentInfo.parent.children : blocksCopy;
  const currentIndex = parentInfo.index;
  const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

  // Проверяем, что не выходим за границы массива
  if (swapIndex < 0 || swapIndex >= siblings.length) {
    return blocks; // Некуда двигать
  }

  // Меняем местами
  [siblings[currentIndex], siblings[swapIndex]] = [siblings[swapIndex], siblings[currentIndex]];

  // Возвращаем измененную копию
  if (parentInfo.parent) {
    return blocksCopy;
  } else {
    return siblings;
  }
};

const updateListItemRecursive = (items, targetId, updateFn) => {
  let found = false;
  const newItems = [];

  for (let i = 0; i < items.length; i++) {
    let item = { ...items[i] };
    if (item.id === targetId) {
      newItems.push(...updateFn(items, i));
      found = true;
      // Пропускаем оставшиеся элементы, так как они уже обработаны в updateFn
      i = items.length;
    } else {
      if (item.children?.length) {
        const result = updateListItemRecursive(item.children, targetId, updateFn);
        item.children = result.newItems;
        found = found || result.found;
      }
      newItems.push(item);
    }
  }
  return { newItems, found };
};

/**
 * Добавляет новый пункт списка после указанного.
 */
export const addListItem = (blocks, currentItemId) => {
  const blocksCopy = JSON.parse(JSON.stringify(blocks));
  const itemInfo = findItemAndParentArrayRecursive(blocksCopy, currentItemId);
  if (!itemInfo) return blocksCopy;

  const { parentArray } = itemInfo;
  const currentIndex = parentArray.findIndex(i => i.id === currentItemId);

  const newItem = { id: nanoid(), type: 'core/list-item', content: '', children: [] };
  parentArray.splice(currentIndex + 1, 0, newItem);

  return { newBlocks: blocksCopy, newItemId: newItem.id };
};

/**
 * Удаляет пункт списка. Если у пункта были вложенные дети, они поднимаются на его уровень.
 */
export const removeListItem = (blocks, currentItemId) => {
  const blocksCopy = JSON.parse(JSON.stringify(blocks));
  const itemInfo = findItemAndParentArrayRecursive(blocksCopy, currentItemId);
  if (!itemInfo) return blocksCopy;

  const { item: itemToRemove, parentArray } = itemInfo;
  const itemIndex = parentArray.findIndex(i => i.id === currentItemId);

  const prevItemId = itemIndex > 0 ? parentArray[itemIndex - 1].id : null;

  const nestedList = itemToRemove.children?.find(c => c.type === 'core/list');
  const itemsToHoist = nestedList?.children || [];
  parentArray.splice(itemIndex, 1, ...itemsToHoist);

  // Если после удаления родительский список опустел, его тоже надо бы удалить,
  // но это усложнит код. Оставим пока так для стабильности.

  return { newBlocks: blocksCopy, prevItemId };
};

export const indentListItem = (blocks, currentItemId) => {
  const blocksCopy = JSON.parse(JSON.stringify(blocks));
  const itemInfo = findItemAndParentArrayRecursive(blocksCopy, currentItemId);
  if (!itemInfo) return blocksCopy;

  const { parentArray } = itemInfo;
  const currentIndex = parentArray.findIndex(i => i.id === currentItemId);
  if (currentIndex === 0) return blocksCopy;

  const itemToMove = parentArray.splice(currentIndex, 1)[0];
  const newParentItem = parentArray[currentIndex - 1];

  if (!newParentItem.children) newParentItem.children = [];

  let nestedList = newParentItem.children.find(c => c.type === 'core/list');
  if (!nestedList) {
    nestedList = {
      id: nanoid(), type: 'core/list', props: { ordered: false }, children: [],
    };
    newParentItem.children.push(nestedList);
  }
  nestedList.children.push(itemToMove);

  return blocksCopy;
};

/**
 * Уменьшает вложенность пункта списка (Shift + Tab).
 */
export const outdentListItem = (blocks, currentItemId) => {
  const blocksCopy = JSON.parse(JSON.stringify(blocks));

  // 1. Используем новую, универсальную функцию поиска
  const path = findBlockPath(blocksCopy, currentItemId);

  // 2. Проверяем, что элемент найден и он достаточно глубоко вложен
  if (!path || path.length < 3) {
    return blocksCopy; // Невозможно уменьшить отступ
  }
  const grandParentItem = path[path.length - 3];

  // Уменьшить отступ можно, только если наш список вложен в другой list-item.
  // Если "дедушка" не является list-item, значит мы уже на верхнем уровне.
  if (grandParentItem.type !== 'core/list-item') {
    return blocksCopy; // Ничего не делаем
  }

  // 3. Определяем наших "игроков" по найденному пути
  const itemToMove = { ...path[path.length - 1] };
  const parentListBlock = path[path.length - 2];

  // 4. Находим родительский массив для grandParentItem
  const grandParentInfo = findItemAndParentArrayRecursive(blocksCopy, grandParentItem.id);
  if (!grandParentInfo) return blocksCopy;
  const { parentArray: grandParentContainerArray } = grandParentInfo;

  // 5. Удаляем элемент из его старого списка
  const itemIndexInParent = parentListBlock.children.findIndex(i => i.id === currentItemId);
  // Забираем все элементы, которые шли после нашего (для переноса)
  const remainingItemsInOldList = parentListBlock.children.slice(itemIndexInParent + 1);
  parentListBlock.children.splice(itemIndexInParent);

  // 6. Находим индекс "дедушки"
  const grandParentIndex = grandParentContainerArray.findIndex(i => i.id === grandParentItem.id);

  // 7. Вставляем наш элемент после "дедушки"
  grandParentContainerArray.splice(grandParentIndex + 1, 0, itemToMove);

  // 8. Переносим "младших братьев" в новый вложенный список
  if (remainingItemsInOldList.length > 0) {
    if (!itemToMove.children) itemToMove.children = [];
    const newNestedList = { id: nanoid(), type: 'core/list', props: parentListBlock.props, children: remainingItemsInOldList };
    itemToMove.children.push(newNestedList);
  }

  // 9. Очищаем пустой родительский список
  if (parentListBlock.children.length === 0) {
    grandParentItem.children = grandParentItem.children.filter(c => c.id !== parentListBlock.id);
  }

  return blocksCopy;
};

/**
 * Обновляет контент конкретного пункта списка.
 */
export const updateListItemContent = (blocks, itemId, newContent) => {
  const blocksCopy = JSON.parse(JSON.stringify(blocks));
  const itemInfo = findItemAndParentArrayRecursive(blocksCopy, itemId);
  if (!itemInfo) return blocksCopy;
  itemInfo.item.content = newContent;
  return blocksCopy;
};

/**
 * Перемещает блок в новую позицию относительно другого блока.
 * @param {Array} blocks - Текущее дерево блоков.
 * @param {string} activeId - ID перемещаемого блока.
 * @param {string} targetId - ID целевого блока.
 * @param {'top'|'bottom'|'inner'} position - Позиция для вставки.
 * @returns {Array|null} - Новое дерево блоков или null, если перемещение невозможно.
 */
export const moveBlock = (blocks, activeId, targetId, position) => {
  // Если цель - 'root', значит, вставляем в конец корневого массива
  if (targetId === 'root') {
    const { block: activeBlock } = findBlockAndParent(blocks, activeId) || {};
    if (!activeBlock) return null;
    const newTree = removeBlockRecursive(blocks, activeId);
    newTree.push(activeBlock);
    return newTree;
  }

  const { block: activeBlock } = findBlockAndParent(blocks, activeId) || {};
  if (!activeBlock) return null;

  if (isAncestor(activeBlock, { id: targetId })) {
    console.warn("Циклическая зависимость: нельзя переместить родителя в потомка.");
    return null;
  }

  // 1. Сначала удаляем активный блок из дерева
  const treeWithoutActive = removeBlockRecursive(blocks, activeId);

  // 2. Рекурсивно ищем, куда вставить
  const insert = (nodes) => {
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (node.id === targetId) {
        if (position === 'inner') {
          // Вкладываем внутрь
          node.children = node.children || [];
          node.children.push(activeBlock);
        } else if (position === 'top') {
          // Вставляем перед целью
          nodes.splice(i, 0, activeBlock);
        } else { // 'bottom'
          // Вставляем после цели
          nodes.splice(i + 1, 0, activeBlock);
        }
        return nodes; // Возвращаем измененный массив
      }

      if (node.children) {
        const newChildren = insert(node.children);
        // Если дочерние элементы были изменены, обновляем их
        if (newChildren !== node.children) {
          node.children = newChildren;
          return nodes; // Возвращаем родительский массив, так как вставка произошла
        }
      }
    }
    return nodes; // Возвращаем массив без изменений, если цель не найдена на этом уровне
  };

  return insert([...treeWithoutActive]);
};

/**
 * Глубоко клонирует блок и всех его детей, назначая им новые уникальные ID.
 * @param {object} block - Блок для клонирования.
 * @returns {object} - Новый блок с новыми ID.
 */
export const deepCloneWithNewIds = (block) => {
  // ВНИМАТЕЛЬНО ПРОВЕРЬТЕ ЭТО УСЛОВИЕ
  // Должно быть именно `!==` (не равно)
  if (!block || typeof block !== 'object') {
    console.error("deepCloneWithNewIds получил некорректные данные:", block);
    return { id: nanoid(), type: 'core/unknown', content: 'Ошибка данных блока' };
  }

  // Создаем копию с новым ID
  const newBlock = {
    ...JSON.parse(JSON.stringify(block)),
    id: nanoid(),
  };

  // Рекурсивно вызываем функцию для всех дочерних элементов
  if (newBlock.children && Array.isArray(newBlock.children)) {
    newBlock.children = newBlock.children.map(child => deepCloneWithNewIds(child));
  }

  return newBlock;
};


/**
 * Рекурсивно находит и заменяет блок в дереве на новый объект.
 * @param {Array} blocks - Массив блоков для поиска.
 * @param {string} blockId - ID блока, который нужно заменить.
 * @param {object} newBlock - Новый объект блока.
 * @returns {Array} - Новый массив блоков с замененным элементом.
 */
export const replaceBlockRecursive = (blocks, blockId, newBlock) => {
  return blocks.map(b => {
    if (b.id === blockId) {
      // Если ID совпал, возвращаем новый блок
      return newBlock;
    }
    // Если у блока есть дети, рекурсивно вызываем функцию для них
    if (b.children?.length) {
      return { ...b, children: replaceBlockRecursive(b.children, blockId, newBlock) };
    }
    // Иначе просто возвращаем блок как есть
    return b;
  });
};