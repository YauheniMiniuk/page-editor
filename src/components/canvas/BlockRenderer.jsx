import React from 'react';
import { BLOCK_COMPONENTS } from '../../utils/constants';
import { useBlockManager } from '../../contexts/BlockManagementContext';

const BlockRenderer = ({ block, mode, parentDirection = 'column', isFirst, isLast, ...rest }) => {
    // Получаем activeId здесь, чтобы передать его вниз
    const { selectedBlockId, activeId, actions } = useBlockManager();
    const ComponentToRender = BLOCK_COMPONENTS[block.type];

    if (!ComponentToRender) {
        return <div>Неизвестный тип блока: {block.type}</div>;
    }

    // Рекурсивный вызов со всеми необходимыми пропсами
    const renderedChildren = block.children?.map((child, index) => (
        <BlockRenderer
            key={child.id}
            block={child}
            mode={mode}
            parentDirection={block.variants?.direction || 'column'}
            isFirst={index === 0}
            isLast={index === block.children.length - 1}
        />
    ));

    return (
        <ComponentToRender
            block={block}
            mode={mode}
            isSelected={selectedBlockId === block.id}
            activeId={activeId}
            onSelect={() => actions.select(block.id)}
            parentDirection={parentDirection}
            isFirst={isFirst}
            isLast={isLast}
            actions={actions}
            {...rest} 
        >
            {renderedChildren}
        </ComponentToRender>
    );
};

export default BlockRenderer;
