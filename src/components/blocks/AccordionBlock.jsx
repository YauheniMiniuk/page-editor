import React, { useState, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { nanoid } from 'nanoid';
import classNames from 'classnames';
import { withBlock } from '../../hocs/withBlock';

// --- UI и иконки ---
import styles from './AccordionBlock.module.css';
import { AccordionIcon, ChevronDownIcon, PlusIcon, TrashIcon, ArrowUpIcon, ArrowDownIcon } from '../../utils/icons'; // Предполагаем, что иконки есть
import Tabs from '../../ui/Tabs';
import Tab from '../../ui/Tab';
import Checkbox from '../../ui/Checkbox';
import Input from '../../ui/Input';
import ToolbarButton from '../../ui/ToolbarButton';

//================================================================================
// 1. Компонент отдельной вкладки (Accordion Item)
//================================================================================
const AccordionItemBlock = forwardRef(({ block, children, className, style, actions, mode, ...rest }, ref) => {
    const { props = {} } = block;
    const { title = "Заголовок" } = props;

    // Эти пропсы придут от родителя (AccordionBlock)
    const { isOpen, onToggle } = rest;
    const isEditMode = mode === 'edit';

    const hasChildren = React.Children.count(children) > 0;

    // Обработчик для редактирования заголовка прямо в блоке
    const handleTitleBlur = (e) => {
        if (!isEditMode) return;

        const newTitle = e.currentTarget.textContent;
        if (newTitle !== title) {
            actions.update(block.id, { props: { ...props, title: newTitle } });
        }
    };

    return (
        <div ref={ref} className={classNames(styles.accordionItem, className)} style={style} {...rest}>
            <button className={styles.itemHeader} onClick={onToggle}>
                <span
                    className={classNames(styles.itemTitle, { [styles.notEditable]: !isEditMode })}
                    contentEditable={isEditMode}
                    suppressContentEditableWarning
                    onBlur={handleTitleBlur}
                    onMouseDown={isEditMode ? (e) => e.stopPropagation() : undefined}
                >
                    {title}
                </span>
                <ChevronDownIcon className={classNames(styles.itemIcon, { [styles.itemIconOpen]: isOpen })} />
            </button>
            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        key="content"
                        initial="collapsed"
                        animate="open"
                        exit="collapsed"
                        variants={{
                            open: { opacity: 1, height: 'auto' },
                            collapsed: { opacity: 0, height: 0 },
                        }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className={styles.itemContent}
                    >
                        {/* Это наша DND-зона */}
                        <div className={styles.contentInner}>
                            {hasChildren ? children : (
                                isEditMode && (
                                    <div className={styles.emptyDropZone}>
                                        Перетащите блок сюда
                                    </div>
                                )
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
});


//================================================================================
// 2. Компонент-обертка для Аккордеона (Accordion Wrapper)
//================================================================================
const AccordionBlock = forwardRef(({ block, children, className, style, actions, ...rest }, ref) => {
    const [openIndexes, setOpenIndexes] = useState([0]); // По умолчанию открыт первый элемент

    const { allowMultipleOpen = false } = block.props || {};

    const handleToggle = (index) => {
        if (allowMultipleOpen) {
            setOpenIndexes(current =>
                current.includes(index) ? current.filter(i => i !== index) : [...current, index]
            );
        } else {
            setOpenIndexes(current => (current.includes(index) ? [] : [index]));
        }
    };

    return (
        <div ref={ref} className={classNames(styles.accordionWrapper, className)} style={style} {...rest}>
            {React.Children.map(children, (child, index) =>
                React.cloneElement(child, {
                    isOpen: openIndexes.includes(index),
                    onToggle: () => handleToggle(index),
                })
            )}
        </div>
    );
});

//================================================================================
// 3. Конфигурация для редактора
//================================================================================

// --- Конфиг для Вкладки (Item) ---
AccordionItemBlock.blockInfo = {
    type: 'core/accordion-item',
    label: 'Элемент аккордеона',
    isContainer: true,
    description: "Отдельная вкладка для блока 'Аккордеон'. Не может быть использована самостоятельно.",
    keywords: ['вкладка', 'панель', 'секция'],

    // --- Правила ---
    parent: ['core/accordion'],
    allowedBlocks: null, // Может содержать любые блоки

    // --- Поддержка функций ---
    supports: {
        // КЛЮЧЕВОЕ ПРАВИЛО: не показывать этот блок в панели добавления
        inserter: false,
        reusable: false,
        html: false,
    },

    // --- Данные ---
    defaultData: {
        type: 'core/accordion-item',
        props: { title: 'Новая вкладка' },
        children: [],
    },
    // Тулбар для отдельной вкладки
    getToolbarItems: ({ block, actions }) => (
        <>
            <ToolbarButton title="Переместить вверх" onClick={() => actions.swapBlock(block.id, 'up')}>
                <ArrowUpIcon />
            </ToolbarButton>
            <ToolbarButton title="Переместить вниз" onClick={() => actions.swapBlock(block.id, 'down')}>
                <ArrowDownIcon />
            </ToolbarButton>
            <div className="toolbarSeparator"></div>
            <ToolbarButton title="Удалить вкладку" onClick={() => actions.delete(block.id)}>
                <TrashIcon />
            </ToolbarButton>
        </>
    ),
};

// --- Конфиг для Обертки (Accordion) ---
AccordionBlock.blockInfo = {
    type: 'core/accordion',
    label: 'Аккордеон',
    icon: <AccordionIcon />,
    isContainer: true,
    description: "Группирует контент в виде сворачиваемых панелей. Отлично подходит для секций FAQ.",
    keywords: ['faq', 'вопросы и ответы', 'список', 'скрытый текст'],

    // --- Правила ---
    parent: null,
    allowedBlocks: ['core/accordion-item'],

    // --- Поддержка функций ---
    supports: {
        reusable: true,
        anchor: true,
        customClassName: true,
        html: false,
    },

    // --- Пример для превью ---
    example: {
        props: { allowMultipleOpen: false },
        children: [
            {
                ...AccordionItemBlock.blockInfo.defaultData,
                id: 'preview_1',
                props: { title: "Что такое HTML Builder?" },
                children: [{ type: 'core/text', id: 'preview_text_1', content: 'Это инструмент для визуального создания веб-страниц.' }]
            },
            { ...AccordionItemBlock.blockInfo.defaultData, id: 'preview_2', props: { title: "Зачем он нужен?" } },
        ]
    },

    // --- Данные ---
    defaultData: () => ({
        type: 'core/accordion',
        props: { allowMultipleOpen: false },
        children: [
            { id: nanoid(), ...AccordionItemBlock.blockInfo.defaultData, props: { title: "Первая вкладка" } },
            { id: nanoid(), ...AccordionItemBlock.blockInfo.defaultData, props: { title: "Вторая вкладка" } },
        ],
    }),
    getToolbarItems: ({ block, actions }) => {
        const handleAddItem = () => {
            const newItem = { id: nanoid(), ...AccordionItemBlock.blockInfo.defaultData };
            actions.update(block.id, {
                children: [...block.children, newItem]
            });
        };

        return (
            <ToolbarButton title="Добавить вкладку" onClick={handleAddItem}>
                <PlusIcon />
            </ToolbarButton>
        );
    },
    // Настройки в боковой панели
    getEditor: ({ block, onChange }) => {
        const { props = {} } = block;

        const handlePropsChange = (newProps) => {
            onChange({ props: { ...props, ...newProps } });
        };

        // Редактирование заголовков всех вкладок централизованно
        const handleItemTitleChange = (itemId, newTitle) => {
            const newChildren = block.children.map(child => {
                if (child.id === itemId) {
                    return { ...child, props: { ...child.props, title: newTitle } };
                }
                return child;
            });
            onChange({ children: newChildren });
        };

        return (
            <Tabs>
                <Tab title="Настройки">
                    <h4>Основные</h4>
                    <Checkbox
                        label="Разрешить несколько открытых вкладок"
                        checked={!!props.allowMultipleOpen}
                        onChange={(e) => handlePropsChange({ allowMultipleOpen: e.target.checked })}
                    />
                    <hr />
                    <h4>Вкладки</h4>
                    <div className={styles.editorList}>
                        {block.children.map(child => (
                            <Input
                                key={child.id}
                                value={child.props.title}
                                onChange={(e) => handleItemTitleChange(child.id, e.target.value)}
                            />
                        ))}
                    </div>
                </Tab>
                <Tab title="Стили">
                    {/* Здесь можно добавить настройки стилей, как у контейнера */}
                    <p>Настройки отступов, цветов и т.д.</p>
                </Tab>
            </Tabs>
        );
    }
};

//================================================================================
// 4. Экспорты
//================================================================================
AccordionBlock.blockStyles = styles;
AccordionItemBlock.blockStyles = styles;

// Экспортируем обернутые HOC'ом компоненты
export const AccordionBlockWrapped = withBlock(AccordionBlock);
export const AccordionItemBlockWrapped = withBlock(AccordionItemBlock);

// Экспорт по умолчанию для основного блока
export default AccordionBlockWrapped;