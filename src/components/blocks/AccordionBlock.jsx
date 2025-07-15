import React, { useState, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { nanoid } from 'nanoid';
import classNames from 'classnames';
import { withBlock } from '../../hocs/withBlock';

// --- UI и иконки ---
import styles from './AccordionBlock.module.css';
import { AccordionIcon, ChevronDownIcon, PlusIcon, TrashIcon, ArrowUpIcon, ArrowDownIcon } from '../../utils/icons';
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

    // Эти пропсы приходят от родителя (AccordionBlock) через React.cloneElement
    const { isOpen, onToggle } = rest;
    const isEditMode = mode === 'edit';

    const hasChildren = React.Children.count(children) > 0;

    const handleTitleBlur = (e) => {
        if (!isEditMode) return;

        const newTitle = e.currentTarget.textContent;
        if (newTitle !== title) {
            actions.update(block.id, { props: { ...props, title: newTitle } });
        }
    };

    // В режиме просмотра вся шапка кликабельна
    const headerProps = {
        ...(!isEditMode && { onClick: onToggle, role: 'button' })
    };

    // В режиме редактирования кликабельна только иконка
    const iconProps = {
        ...(isEditMode && { onClick: onToggle, role: 'button' })
    };

    return (
        <div ref={ref} className={classNames(styles.accordionItem, className)} style={style} {...rest}>
            <div className={styles.itemHeader} {...headerProps}>
                <span
                    className={classNames(styles.itemTitle, { [styles.notEditable]: !isEditMode })}
                    contentEditable={isEditMode}
                    suppressContentEditableWarning
                    onBlur={handleTitleBlur}
                    onClick={isEditMode ? e => e.stopPropagation() : undefined}
                    onKeyDown={isEditMode ? e => e.stopPropagation() : undefined}
                >
                    {title}
                </span>
                <ChevronDownIcon 
                    className={classNames(styles.itemIcon, { [styles.itemIconOpen]: isOpen })} 
                    {...iconProps} 
                />
            </div>
            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        key="content"
                        initial="collapsed"
                        animate="open"
                        exit="collapsed"
                        variants={{
                            open: { opacity: 1, height: 'auto', overflow: 'hidden' },
                            collapsed: { opacity: 0, height: 0, overflow: 'hidden' },
                        }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className={styles.itemContent}
                    >
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
// 2. Компонент-обертка для Аккордеона
//================================================================================
const AccordionBlock = forwardRef(({ block, children, className, style, ...rest }, ref) => {
    // Храним в состоянии ID открытых вкладок, а не их индексы
    const [openIds, setOpenIds] = useState(() => [block.children?.[0]?.id].filter(Boolean));

    const { allowMultipleOpen = false } = block.props || {};

    const handleToggle = (itemId) => {
        setOpenIds(currentIds => {
            const isOpen = currentIds.includes(itemId);
            if (allowMultipleOpen) {
                return isOpen ? currentIds.filter(id => id !== itemId) : [...currentIds, itemId];
            } else {
                return isOpen ? [] : [itemId];
            }
        });
    };

    return (
        <div ref={ref} className={classNames(styles.accordionWrapper, className)} style={style} {...rest}>
            {React.Children.map(children, (child) =>
                React.cloneElement(child, {
                    isOpen: openIds.includes(child.props.block.id),
                    onToggle: () => handleToggle(child.props.block.id),
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
    parent: ['core/accordion'],
    allowedBlocks: null,
    supports: {
        inserter: false,
        reusable: false,
        html: false,
    },
    defaultData: {
        type: 'core/accordion-item',
        props: { title: 'Новая вкладка' },
        children: [],
    },
    getToolbarItems: ({ block, actions }) => (
        <>
            <ToolbarButton title="Переместить вверх" onClick={() => actions.swap(block.id, 'up')}>
                <ArrowUpIcon />
            </ToolbarButton>
            <ToolbarButton title="Переместить вниз" onClick={() => actions.swap(block.id, 'down')}>
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
    parent: null,
    allowedBlocks: ['core/accordion-item'],
    supports: {
        reusable: true,
        anchor: true,
        customClassName: true,
        html: false,
    },
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
    getEditor: ({ block, onChange }) => {
        const { props = {} } = block;

        const handlePropsChange = (newProps) => {
            onChange({ props: { ...props, ...newProps } });
        };

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

export const AccordionBlockWrapped = withBlock(AccordionBlock);
export const AccordionItemBlockWrapped = withBlock(AccordionItemBlock);

export default AccordionBlockWrapped;