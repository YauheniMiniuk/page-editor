import React, { forwardRef } from 'react';
import { withBlock } from '../../../hocs/withBlock';

const TableBodyBlock = forwardRef(({ children, ...rest }, ref) => (
    <tbody ref={ref} {...rest}>
        {children}
    </tbody>
));

TableBodyBlock.blockInfo = {
    type: 'core/table-body',
    label: 'Тело таблицы',
    isContainer: true,
    parent: ['core/table'],
    allowedBlocks: ['core/table-row'],
    supports: { inserter: false },
};

export default withBlock(TableBodyBlock);