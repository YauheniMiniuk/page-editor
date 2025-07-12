import React, { useState, forwardRef } from 'react';
import { motion } from 'framer-motion';
import classNames from 'classnames';
import { nanoid } from 'nanoid';

import styles from './TabsBlock.module.css';
import { withBlock } from '../../hocs/withBlock';

// --- UI ---
import { TabsIcon, PlusIcon } from '../../utils/icons';
import ToolbarButton from '../../ui/ToolbarButton';

//================================================================================
// 1. Дочерний компонент для ОДНОЙ вкладки (ее контента)
//================================================================================
const TabItemBlock = forwardRef(({ block, children, className, style, ...rest }, ref) => {
    // Этот компонент просто обертка для контента, он всегда видимый,
    // а родитель решает, показывать его или нет.
    return (
        <motion.div ref={ref} className={classNames(styles.tabContent, className)} style={style} {...rest}>
            {children}
        </motion.div>
    );
});


//================================================================================
// 2. Родительский компонент-обертка для Табов
//================================================================================
const TabsBlock = forwardRef(({ block, children, mode, className, style, actions, ...rest }, ref) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const isEditMode = mode === 'edit';

    const handleTitleUpdate = (itemId, newTitle) => {
        const newChildren = block.children.map(child =>
            child.id === itemId ? { ...child, props: { ...child.props, title: newTitle } } : child
        );
        actions.update(block.id, { children: newChildren });
    };

    return (
        <div ref={ref} className={classNames(styles.tabsWrapper, className)} style={style} {...rest}>
            {/* Навигация по табам */}
            <div className={styles.tabNav}>
                {block.children.map((tabItem, index) => (
                    <button
                        key={tabItem.id}
                        className={classNames(styles.tabButton, { [styles.isActive]: activeIndex === index })}
                        onClick={() => setActiveIndex(index)}
                    >
                        <span
                            contentEditable={isEditMode}
                            suppressContentEditableWarning={true}
                            onBlur={(e) => handleTitleUpdate(tabItem.id, e.currentTarget.textContent)}
                            onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                        >
                            {tabItem.props.title || 'Вкладка'}
                        </span>
                    </button>
                ))}
                {isEditMode && (
                    <ToolbarButton
                        title="Добавить вкладку"
                        onClick={() => actions.add(block.id, TabItemBlock.blockInfo.defaultData(), 'inner')}
                        small
                    >
                        <PlusIcon />
                    </ToolbarButton>
                )}
            </div>

            {/* Контент активной вкладки */}
            {/* Мы рендерим только активный дочерний компонент */}
            {children[activeIndex]}
        </div>
    );
});


//================================================================================
// 3. Конфигурация для редактора
//================================================================================

// --- Конфиг для ОДНОЙ Вкладки ---
TabItemBlock.blockInfo = { // <-- Это СТАТИЧЕСКИЙ ОБЪЕКТ
    type: 'custom/tab-item',
    label: 'Вкладка',
    isContainer: true,
    parent: ['custom/tabs'],
    supports: { inserter: false },
    // А вот defaultData - это ФУНКЦИЯ внутри объекта
    defaultData: () => ({
        id: nanoid(),
        type: 'custom/tab-item',
        props: { title: 'Новая вкладка' },
        children: [{
            id: nanoid(),
            type: 'core/text',
            content: 'Содержимое новой вкладки...',
            props: { as: 'p' },
            variants: {},
            styles: {},
        }],
    }),
};

// --- Конфиг для Табов ---
TabsBlock.blockInfo = { // <-- Это тоже СТАТИЧЕСКИЙ ОБЪЕКТ
    type: 'custom/tabs',
    label: 'Вкладки (Табы)',
    icon: <TabsIcon />,
    isContainer: true,
    description: 'Отображает контент в виде переключаемых вкладок.',
    keywords: ['табы', 'вкладки', 'панели', 'tabs'],

    parent: null,
    allowedBlocks: ['custom/tab-item'],

    supports: { reusable: true, anchor: true },

    // И здесь defaultData - это ФУНКЦИЯ
    defaultData: () => ({
        type: 'custom/tabs',
        children: [
            TabItemBlock.blockInfo.defaultData(), // Вызываем как функцию
            TabItemBlock.blockInfo.defaultData(), // И здесь тоже
        ],
    }),

    getToolbarItems: ({ block, actions }) => {
        const handleAddItem = () => {
            // И здесь вызываем как функцию для получения уникальных данных
            const newItem = TabItemBlock.blockInfo.defaultData();
            actions.update(block.id, { children: [...block.children, newItem] });
        };
        return (
            <ToolbarButton title="Добавить вкладку" onClick={handleAddItem}>
                <PlusIcon />
            </ToolbarButton>
        );
    },
};

//================================================================================
// 4. Экспорты
//================================================================================
export const TabsBlockWrapped = withBlock(TabsBlock);
export const TabItemBlockWrapped = withBlock(TabItemBlock);

export default TabsBlockWrapped;