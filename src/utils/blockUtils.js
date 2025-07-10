import { BLOCK_TYPES } from "./constants";

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

const insertIntoArray = (arr, item, index) => {
  const newArr = [...arr];
  if (index < 0) {
    newArr.unshift(item);
  } else if (index >= newArr.length) {
    newArr.push(item);
  } else {
    newArr.splice(index, 0, item);
  }
  return newArr;
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