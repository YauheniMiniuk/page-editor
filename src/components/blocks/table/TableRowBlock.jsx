// src/blocks/core/table/TableRowBlock.jsx
import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import classNames from 'classnames';
import { withBlock } from '../../../hocs/withBlock';
import styles from './Table.module.css';
import ToolbarButtonGroup from '../../../ui/ToolbarButtonGroup';
import ToolbarButton from '../../../ui/ToolbarButton';
import { Rows, Trash2 } from 'lucide-react';

const TableRowBlock = forwardRef(({ block, children, className, style, ...rest }, ref) => (
    <tr ref={ref} className={classNames(styles.row, className)} {...rest}>
        {children}
    </tr>
));

TableRowBlock.blockInfo = {
    type: 'core/table-row',
    label: 'Строка таблицы',
    isContainer: true,
    parent: ['core/table-head', 'core/table-body'],
    allowedBlocks: ['core/table-cell'],
    supports: { inserter: false },
    defaultData: () => ({
        type: 'core/table-row',
        children: [] // По умолчанию строка пустая
    }),
    getToolbarItems: ({ block, actions }) => (
        <ToolbarButtonGroup>
            <ToolbarButton title="Удалить строку" onClick={() => actions.delete(block.id)}>
                <Trash2 size={16} />
            </ToolbarButton>
        </ToolbarButtonGroup>
    ),
};
export default withBlock(TableRowBlock);