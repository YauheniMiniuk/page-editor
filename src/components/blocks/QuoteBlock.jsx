import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import classNames from 'classnames';
import { nanoid } from 'nanoid';

import styles from './QuoteBlock.module.css';
import { withBlock } from '../../hocs/withBlock';

// --- UI ---
import { QuoteIcon } from '../../utils/icons';

//================================================================================
// 1. Компонент блока "Цитата"
//================================================================================
const QuoteBlock = forwardRef(({ block, children, className, style, ...rest }, ref) => {
    // Мы больше не берем children из `block.children`.
    // Мы принимаем уже готовые, отрендеренные дочерние компоненты через проп `children`.

    return (
        <motion.blockquote
            ref={ref}
            className={classNames(styles.quote, className)}
            style={{ ...block.styles, ...style }}
            {...rest}
        >
            {/* Просто вставляем готовых детей сюда */}
            {children}
        </motion.blockquote>
    );
});

QuoteBlock.blockStyles = styles;

//================================================================================
// 2. "Паспорт" блока
//================================================================================
QuoteBlock.blockInfo = {
    type: 'core/quote',
    label: 'Цитата',
    icon: <QuoteIcon />,
    isContainer: true, // Это контейнер, но с особыми правилами

    description: 'Добавляет блок для выделения цитат с указанием автора.',
    keywords: ['цитата', 'высказывание', 'отзыв'],

    // --- Правила ---
    parent: null,
    // Разрешаем содержать только текст. Это предотвратит вставку кнопок или картинок внутрь цитаты.
    allowedBlocks: ['core/text'],

    supports: {
        reusable: true,
        anchor: true,
        html: false,
    },

    // --- Данные по умолчанию: создаем паттерн из двух текстовых блоков ---
    defaultData: () => ({
        type: 'core/quote',
        children: [
            {
                id: nanoid(),
                type: 'core/text',
                content: 'Текст цитаты...',
                props: { as: 'p' }, // Важно указать тег
                variants: { fontSize: 'large', fontStyle: 'italic' }, // Кастомные варианты
            },
            {
                id: nanoid(),
                type: 'core/text',
                content: 'Автор',
                props: { as: 'cite' }, // Используем семантически верный тег
                variants: { textAlign: 'right' },
            },
        ],
        props: {},
        styles: {},
        variants: {},
    }),

    // У самого блока-обертки нет настроек, все настройки у дочерних блоков
    getToolbarItems: () => null,
    getEditor: () => <p>Все настройки доступны в дочерних блоках (текст и автор).</p>
};

export default withBlock(QuoteBlock);