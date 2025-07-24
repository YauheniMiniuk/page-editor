// src/blocks/core/table/TableBlock.jsx
import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import classNames from 'classnames';
import { withBlock } from '../../../hocs/withBlock';
import styles from './Table.module.css';
import { nanoid } from 'nanoid';

// Импортируем дочерние блоки, чтобы получить их defaultData
import TableCellBlock from './TableCellBlock';
import TableRowBlock from './TableRowBlock';
import { Columns, Plus, Rows, TableIcon } from 'lucide-react';
import ToolbarButtonGroup from '../../../ui/ToolbarButtonGroup';
import ToolbarButton from '../../../ui/ToolbarButton';

const TableBlock = forwardRef(({ block, children, className, style, ...rest }, ref) => {
    // В этой архитектуре таблица - это просто контейнер для thead и tbody
    return (
        <div ref={ref} className={classNames(styles.tableWrapper, className)}>
            <table className={styles.table} style={{ ...block.styles, ...style }} {...rest}>
                {children}
            </table>
        </div>
    );
});

TableBlock.blockInfo = {
    type: 'core/table',
    label: 'Таблица',
    icon: <TableIcon />,
    isContainer: true,
    allowedBlocks: ['core/table-head', 'core/table-body'],

    defaultData: () => {
        // Создаем сложную структуру по умолчанию
        const createRow = (cols, isHeader = false) => ({
            id: nanoid(),
            type: 'core/table-row',
            children: Array.from({ length: cols }, () => ({
                id: nanoid(),
                ...TableCellBlock.blockInfo.defaultData({ isHeader })
            }))
        });

        return {
            type: 'core/table',
            props: {},
            children: [
                {
                    id: nanoid(),
                    type: 'core/table-head', // Невидимый блок-обертка для <thead>
                    isContainer: true,
                    // Этот блок не будет иметь своего компонента, он просто для структуры
                    // Его children будут отрендерены напрямую в BlockRenderer
                    children: [createRow(2, true)]
                },
                {
                    id: nanoid(),
                    type: 'core/table-body', // Обертка для <tbody>
                    isContainer: true,
                    children: [createRow(2), createRow(2)]
                }
            ]
        };
    },
    getToolbarItems: ({ block, actions }) => {
        const handleAddRow = () => {
            const tableBody = block.children.find(child => child.type === 'core/table-body');
            if (!tableBody) return;

            const colCount = tableBody.children[0]?.children.length || 1;
            const newRow = { id: nanoid(), type: 'core/table-row', children: Array.from({ length: colCount }, () => ({ id: nanoid(), ...TableCellBlock.blockInfo.defaultData() })) };

            // Обновляем дочерние элементы блока table-body
            actions.update(tableBody.id, {
                children: [...tableBody.children, newRow]
            });
        };

        const handleAddColumn = () => {
            // Эта функция должна добавить ячейку в каждую строку
            const newChildren = block.children.map(section => { // section: table-head или table-body
                const newRows = section.children.map(row => {
                    const isHeader = section.type === 'core/table-head';
                    const newCell = { id: nanoid(), ...TableCellBlock.blockInfo.defaultData({ isHeader }) };
                    return { ...row, children: [...row.children, newCell] };
                });
                return { ...section, children: newRows };
            });
            actions.update(block.id, { children: newChildren });
        };

        return (
            <ToolbarButtonGroup>
                <ToolbarButton title="Добавить строку" onClick={handleAddRow}>
                    <Plus size={16} /> <Rows size={16} />
                </ToolbarButton>
                <ToolbarButton title="Добавить столбец" onClick={handleAddColumn}>
                    <Plus size={16} /> <Columns size={16} />
                </ToolbarButton>
            </ToolbarButtonGroup>
        );
    }
};
export default withBlock(TableBlock);