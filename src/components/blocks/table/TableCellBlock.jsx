// src/blocks/core/table/TableCellBlock.jsx
import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import classNames from 'classnames';
import { withBlock } from '../../../hocs/withBlock';
import styles from './Table.module.css'; // Общие стили для всей таблицы
import { Merge } from 'lucide-react';
import Input from '../../../ui/Input';
import ToolbarButton from '../../../ui/ToolbarButton';
import ToolbarButtonGroup from '../../../ui/ToolbarButtonGroup';

const TableCellBlock = forwardRef(({ block, children, className, style, ...rest }, ref) => {
    const { props = {} } = block;
    const Tag = props.isHeader ? 'th' : 'td';

    return (
        <Tag
            ref={ref}
            className={classNames(styles.cell, className)}
            style={{ ...block.styles, ...style }}
            colSpan={props.colspan || 1}
            rowSpan={props.rowspan || 1}
            {...rest}
        >
            {children}
        </Tag>
    );
});

TableCellBlock.blockInfo = {
    type: 'core/table-cell',
    label: 'Ячейка таблицы',
    isContainer: true,
    parent: ['core/table-row'],
    supports: { inserter: false }, // Нельзя добавить из общей панели
    defaultData: (props = {}) => ({
        type: 'core/table-cell',
        props: { isHeader: false, colspan: 1, rowspan: 1, ...props },
        // Теперь по умолчанию ячейка пустая, а BlockRenderer добавит в нее Appender
        children: [],
    }),

    getToolbarItems: ({ block, actions }) => (
        <ToolbarButtonGroup>
            <ToolbarButton title="Объединить ячейки (скоро)">
                <Merge size={16} />
            </ToolbarButton>
        </ToolbarButtonGroup>
    ),

    getEditor: ({ block, onChange }) => {
        const { props } = block;
        const handlePropsChange = (newProps) => onChange({ props: { ...props, ...newProps } });
        return (
            <div style={{ display: 'flex', gap: '8px', padding: '16px' }}>
                <Input label="Colspan" type="number" min="1" value={props.colspan} onChange={(e) => handlePropsChange({ colspan: Number(e.target.value) })} />
                <Input label="Rowspan" type="number" min="1" value={props.rowspan} onChange={(e) => handlePropsChange({ rowspan: Number(e.target.value) })} />
            </div>
        )
    }
};
export default withBlock(TableCellBlock);