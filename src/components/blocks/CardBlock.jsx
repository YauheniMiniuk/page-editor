import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import classNames from 'classnames';
import { nanoid } from 'nanoid';

import styles from './CardBlock.module.css';
import { withBlock } from '../../hocs/withBlock';
import { CardIcon } from '../../utils/icons';

//================================================================================
// 1. Компонент блока "Карточка"
//================================================================================
const CardBlock = forwardRef(({ block, children, className, style, ...rest }, ref) => {
    // Этот блок - просто стилизованная обертка для дочерних блоков.
    // Всю работу по рендерингу детей делает BlockRenderer.
    return (
        <motion.div
            ref={ref}
            className={classNames(styles.card, className)}
            style={{ ...block.styles, ...style }}
            {...rest}
        >
            <div className={styles.cardContent}>
                {children}
            </div>
        </motion.div>
    );
});

CardBlock.blockStyles = styles;

//================================================================================
// 2. "Паспорт" блока
//================================================================================
CardBlock.blockInfo = {
    type: 'custom/card',
    label: 'Карточка',
    icon: <CardIcon />,
    isContainer: true,
    description: 'Готовый компонент с изображением, заголовком, текстом и кнопкой.',
    keywords: ['карточка', 'превью', 'тизер', 'card', 'teaser'],

    // --- Правила ---
    parent: null,
    // Запрещаем добавлять/удалять блоки внутри, чтобы не сломать структуру
    allowedBlocks: [],

    supports: { reusable: true },

    // --- Данные по умолчанию: создаем паттерн из готовых блоков ---
    // ВНИМАНИЕ: Используем статический объект, как договорились.
    defaultData: () => ({
        type: 'custom/card',
        children: [
            {
                id: nanoid(),
                type: 'core/image',
                props: { src: 'https://via.placeholder.com/400x250?text=Image', alt: '' },
                variants: { shape: 'default' },
            },
            {
                id: nanoid(),
                type: 'core/heading',
                content: 'Заголовок карточки',
                props: { level: 4 },
            },
            {
                id: nanoid(),
                type: 'core/text',
                content: 'Краткое описание, которое рассказывает о чем-то очень интересном и важном.',
            },
            {
                id: nanoid(),
                type: 'core/button',
                props: { content: 'Подробнее' },
                variants: { style: 'primary', size: 'small' }
            }
        ],
    }),

    // У самой карточки нет настроек, все редактируется во внутренних блоках
    getToolbarItems: () => null,
    getEditor: () => <p>Чтобы изменить содержимое, выберите нужный блок внутри карточки (изображение, заголовок и т.д.).</p>,
};

export default withBlock(CardBlock);