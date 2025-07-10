import React, { useState, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './AccordionBlock.module.css';
import { withBlockFeatures } from '../../hocs/withBlockFeatures';

// UI компоненты из твоего проекта
import Switch from '../../ui/Switch';
import Tabs from '../../ui/Tabs';
import Tab from '../../ui/Tab';
import ToolbarButton from '../../ui/ToolbarButton';

// --- Иконки (простые SVG для примера) ---
const AccordionIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 6H20M4 12H20M4 18H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const ChevronDownIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

// Иконки для тулбара
const PlusIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const TrashIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 6h18m-2 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);


// --- Компонент Элемента Аккордеона (без изменений) ---
const AccordionItem = ({ block, children, isOpen, onToggle, mode }) => {
    const headerChild = React.Children.toArray(children)[0];
    const contentChildren = React.Children.toArray(children).slice(1);
    const isEditMode = mode === 'edit';

    // В режиме просмотра клик по заголовку открывает/закрывает элемент.
    // В режиме редактирования клики обрабатываются BlockRenderer для выделения блоков.
    const handleHeaderClick = isEditMode ? (e) => e.preventDefault() : onToggle;

    return (
        <div className={styles.item}>
            <div
                className={styles.itemHeader}
                // Используем onMouseDown, чтобы не конфликтовать с dnd-kit, который может использовать onClick
                onMouseDown={handleHeaderClick}
            >
                <div className={styles.itemTitle}>{headerChild}</div>
                 <button type="button" onClick={onToggle} className={styles.itemChevronButton}>
                    <div className={`${styles.itemIcon} ${isOpen ? styles.itemIconOpen : ''}`}>
                        <ChevronDownIcon />
                    </div>
                </button>
            </div>
            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        className={styles.itemContent}
                        initial="collapsed"
                        animate="open"
                        exit="collapsed"
                        variants={{
                            open: { opacity: 1, height: 'auto' },
                            collapsed: { opacity: 0, height: 0 },
                        }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                        <div className={styles.itemContentInner}>
                            {contentChildren}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};


// --- Основной Компонент Блока Аккордеона ---
const AccordionBlock = forwardRef(({ block, children, mode, className, ...restProps }, ref) => {
    const { variants = {} } = block;
    const [openIndexes, setOpenIndexes] = useState([0]);

    const handleToggle = (indexToToggle) => {
        if (variants.openMultiple) {
            setOpenIndexes(prev =>
                prev.includes(indexToToggle)
                    ? prev.filter(i => i !== indexToToggle)
                    : [...prev, indexToToggle]
            );
        } else {
            setOpenIndexes(prev => (prev.includes(indexToToggle) ? [] : [indexToToggle]));
        }
    };

    const finalClasses = [styles.accordion, className].filter(Boolean).join(' ');

    return (
        <div ref={ref} className={finalClasses} {...restProps}>
            {React.Children.map(children, (child, index) => {
                if (!child.props.block || child.props.block.type !== 'core/accordion-item') {
                    return child;
                }
                return (
                    <AccordionItem
                        key={child.props.block.id}
                        block={child.props.block}
                        isOpen={openIndexes.includes(index)}
                        onToggle={() => handleToggle(index)}
                        mode={mode}
                    >
                        {child.props.children}
                    </AccordionItem>
                );
            })}
        </div>
    );
});

// --- Информация о блоке Аккордеона ---
AccordionBlock.blockInfo = {
    type: 'core/accordion',
    label: 'Аккордеон',
    icon: <AccordionIcon />,
    // НОВОЕ: Указываем, что этот блок может содержать только элементы аккордеона
    allowedBlocks: ['core/accordion-item'],

    defaultData: {
        type: 'core/accordion',
        children: [
            { ...generateNewAccordionItem('Заголовок 1', 'Содержимое первого элемента.') },
            { ...generateNewAccordionItem('Заголовок 2', 'Содержимое второго элемента.') },
        ],
        variants: { openMultiple: false },
        props: {},
        styles: {},
    },

    supportedVariants: {
        openMultiple: { label: 'Открывать несколько' },
    },
    
    // НОВОЕ: Добавляем кнопку "Добавить элемент" в тулбар самого аккордеона
    getToolbarItems: ({ block, actions }) => {
        const handleAddItem = () => {
            const newItem = generateNewAccordionItem('Новый заголовок', 'Новое содержимое.');
            actions.update(block.id, {
                children: [...block.children, newItem],
            });
        };

        return [
            <ToolbarButton key="add-item" title="Добавить элемент" onClick={handleAddItem}>
                <PlusIcon />
            </ToolbarButton>
        ];
    },
    
    getEditor: ({ block, onChange }, helpers) => {
        const { variants = {} } = block;
        const handleVariantChange = (name, value) => helpers.updateVariant(name, value);

        return (
            <Tabs>
                <Tab title="Настройки">
                    <h4>Опции аккордеона</h4>
                    <Switch
                        label="Разрешить открытие нескольких элементов"
                        checked={!!variants.openMultiple}
                        onChange={(isChecked) => handleVariantChange('openMultiple', isChecked)}
                    />
                </Tab>
            </Tabs>
        );
    },
};

// --- Компонент для Блока Элемента Аккордеона ---
const AccordionItemBlock = forwardRef(({ block, children, className, ...restProps }, ref) => {
    return (
        <div ref={ref} className={`${styles.accordionItemWrapper} ${className}`} {...restProps}>
            {children}
        </div>
    );
});

// --- Информация о блоке Элемента Аккордеона ---
AccordionItemBlock.blockInfo = {
    type: 'core/accordion-item',
    label: 'Элемент аккордеона',
    // НОВОЕ: Указываем, что этот блок может быть только внутри аккордеона
    parent: ['core/accordion'],
    
    defaultData: {
        type: 'core/accordion-item',
        children: [
            { type: 'core/paragraph', props: { content: 'Новый заголовок' } },
            { type: 'core/container', children: [] }
        ],
        props: {},
        styles: {},
    },

    // НОВОЕ: Добавляем кнопку "Удалить" в тулбар каждого элемента
    getToolbarItems: ({ block, actions }) => {
        return [
            <ToolbarButton key="delete-item" title="Удалить элемент" onClick={() => actions.delete(block.id)}>
                <TrashIcon />
            </ToolbarButton>
        ];
    },
};

// --- Хелпер для генерации нового элемента с уникальными ID ---
function generateNewAccordionItem(title, content) {
    const randomSuffix = Math.random().toString(36).substring(2, 9);
    const dateSuffix = Date.now();
    const uniqueId = `${dateSuffix}-${randomSuffix}`;
    
    return {
        type: 'core/accordion-item',
        id: `accordion-item-${uniqueId}`,
        children: [
            { type: 'core/text', id: `text-title-${uniqueId}`, props: { content: title } },
            { 
                type: 'core/container', 
                id: `container-content-${uniqueId}`, 
                children: [
                    { type: 'core/paragraph', id: `text-content-${uniqueId}`, props: { content: content } }
                ] 
            }
        ]
    };
}


// Экспортируем оба блока для регистрации в системе
export { AccordionBlock, AccordionItemBlock };
