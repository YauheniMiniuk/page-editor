import React, { memo } from 'react';
import { BLOCK_COMPONENTS } from '../../utils/constants';
import { useBlockManager } from '../../contexts/BlockManagementContext';

const BlockRenderer = ({ block, mode, blockNodesRef, layoutDirection = 'column', onSaveAsPattern, ...rest }) => {
    const ComponentToRender = BLOCK_COMPONENTS[block.type];
    const { blockInfo } = ComponentToRender || {};

    if (!ComponentToRender) {
        return <div>Неизвестный тип блока: {block.type}</div>;
    }

    let currentLayoutDirection = 'row'; // Значение по умолчанию

    if (blockInfo?.layoutDirection) {
        // Если layoutDirection - это функция (как у ContainerBlock), вызываем её
        if (typeof blockInfo.layoutDirection === 'function') {
            currentLayoutDirection = blockInfo.layoutDirection(block);
        } else {
            // Иначе - это строка (как у ColumnsBlock)
            currentLayoutDirection = blockInfo.layoutDirection;
        }
    }

    // Рекурсивный вызов со всеми необходимыми пропсами
    const renderedChildren = block.children?.map((child, index) => (
        <BlockRenderer
            key={child.id}
            block={child}
            mode={mode}
            layoutDirection={currentLayoutDirection}
            blockNodesRef={blockNodesRef}
            onSaveAsPattern={onSaveAsPattern}
        />
    ));

    return (
        <ComponentToRender
            block={block}
            mode={mode}
            layoutDirection={currentLayoutDirection}
            blockNodesRef={blockNodesRef}
            onSaveAsPattern={onSaveAsPattern}
            {...rest}
        >
            {renderedChildren}
        </ComponentToRender>
    );
};

export default memo(BlockRenderer);
