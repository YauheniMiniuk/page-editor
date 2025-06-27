const isAncestor = (blocks, potentialAncestorId, childId) => {
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
  // Защита от вставки контейнера в самого себя
  if (blockToInsert.type === 'container' && targetId) {
    if (blockToInsert.id === targetId || isAncestor(currentBlocks, blockToInsert.id, targetId)) {
      console.warn("Нельзя переместить контейнер внутрь одного из его дочерних элементов.");
      return currentBlocks; // Прерываем операцию
    }
  }

  let blocksCopy = JSON.parse(JSON.stringify(currentBlocks));

  if (targetId === 'canvas-root-dropzone') {
    blocksCopy.push(blockToInsert);
    return blocksCopy;
  }

  const targetInfo = findBlockAndParent(blocksCopy, targetId);
  if (!targetInfo) {
    return blocksCopy; // Возвращаем клон, если цель не найдена
  }
  const { block: targetBlock, parent: targetParent } = targetInfo;

  // Вставка внутрь контейнера
  if (position === 'inner' && targetBlock.type === 'CONTAINER') {
    if (!targetBlock.children) {
      targetBlock.children = [];
    }
    // Эта мутация теперь безопасна, так как мы работаем с глубокой копией.
    targetBlock.children.push(blockToInsert);
    return blocksCopy;
  }

  // Вставка до/после целевого блока
  const arrayToModify = targetParent ? targetParent.children : blocksCopy;
  const targetIndex = arrayToModify.findIndex(b => b.id === targetId);
  const insertIdx = (position === 'bottom' || position === 'right')
    ? targetIndex + 1
    : targetIndex;

  // Вставляем элемент в массив
  const newArrayToModify = [
    ...arrayToModify.slice(0, insertIdx),
    blockToInsert,
    ...arrayToModify.slice(insertIdx),
  ];

  if (targetParent) {
    targetParent.children = newArrayToModify;
    return blocksCopy;
  } else {
    return newArrayToModify;
  }
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
    if (b.id === id) return { ...b, ...newProps };
    if (b.children && Array.isArray(b.children)) {
      return { ...b, children: updateBlockRecursive(b.children, id, newProps) };
    }
    return b;
  });
};