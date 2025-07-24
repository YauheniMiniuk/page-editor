import React, { forwardRef } from 'react';
import { withBlock } from '../../../hocs/withBlock';

const TableHeadBlock = forwardRef(({ children, ...rest }, ref) => (
    <thead ref={ref} {...rest}>
        {children}
    </thead>
));

TableHeadBlock.blockInfo = {
    type: 'core/table-head',
    label: 'Шапка таблицы',
    isContainer: true,
    parent: ['core/table'],
    allowedBlocks: ['core/table-row'],
    supports: { inserter: false }, // Скрываем из общей панели добавления
};

export default withBlock(TableHeadBlock);