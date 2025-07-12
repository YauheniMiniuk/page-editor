import React, { forwardRef, memo, useEffect, useLayoutEffect, useRef } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { motion } from 'framer-motion';
import classNames from 'classnames';
import { nanoid } from 'nanoid';

import styles from './ListBlock.module.css';
import { withBlock } from '../../hocs/withBlock';

// --- UI ---
import Tabs from '../../ui/Tabs';
import Tab from '../../ui/Tab';
import ToolbarButton from '../../ui/ToolbarButton';
import { ListIcon, ListUnorderedIcon, ListOrderedIcon } from '../../utils/icons';
import BlockRenderer from '../canvas/BlockRenderer';
import PresetSelector from '../../ui/PresetSelector';
import { useBlockManager } from '../../contexts/BlockManagementContext';
import { setCursorPosition } from '../../utils/domUtils';

//================================================================================
// Единственный компонент, который рендерит и себя, и вложенные списки
//================================================================================
const ListBlock = forwardRef(({ block, mode, className, style, ...rest }, ref) => {
    const { props = {}, children = [] } = block;
    const isEditMode = mode === 'edit';
    const MotionTag = motion[props.ordered ? 'ol' : 'ul'];
    const { actions } = useBlockManager();

    // --- Обработчики событий ---

    // Отложенное обновление, чтобы избежать гонки состояний
    const debouncedUpdate = useDebouncedCallback((itemId, newContent) => {
        actions.updateListItemContent(itemId, newContent);
    }, 150);

    const handleKeyDown = (e, item) => {
        if (!isEditMode) return;

        if (e.shiftKey && e.key === 'Enter') { e.preventDefault(); actions.addListItem(item.id); }
        if (e.key === 'Tab' && !e.shiftKey) { e.preventDefault(); actions.indentListItem(item.id); }
        if (e.key === 'Tab' && e.shiftKey) { e.preventDefault(); actions.outdentListItem(item.id); }
        if (e.key === 'Backspace' && e.currentTarget.innerHTML === '') { e.preventDefault(); actions.removeListItem(item.id); }
    };

    // --- Рендеринг ---

    return (
        <MotionTag ref={ref} className={classNames(styles.list, className)} style={{ ...block.styles, ...style }} {...rest}>
            {
                children.map(item => (
                    <ListItem
                        key={item.id}
                        item={item}
                        isEditMode={isEditMode}
                        onKeyDown={handleKeyDown}
                        onUpdate={debouncedUpdate}
                        mode={mode}
                    />
                ))
            }
        </MotionTag >
    );
});

// "Умный" компонент для <li>, чтобы избежать лишних перерисовок
const ListItem = React.memo(({ item, isEditMode, onKeyDown, onUpdate, mode }) => {
    const contentRef = useRef(null);

    const { focusRequest, actions } = useBlockManager();

    // Этот хук отвечает за синхронизацию контента
    useLayoutEffect(() => {
        if (contentRef.current && contentRef.current.innerHTML !== item.content) {
            contentRef.current.innerHTML = item.content;
        }
    }, [item.content]);

    useEffect(() => {
        if (focusRequest && focusRequest.targetId === item.id) {
            setCursorPosition(contentRef.current, focusRequest.position);
            actions.clearFocusRequest();
        }
    }, [focusRequest, actions, item.id]);


    return (
        <li className={styles.listItem}>
            {/* Редактируемый контент пункта */}
            <span
                className={styles.listItemContent}
                ref={contentRef}
                data-editable-id={item.id}
                contentEditable={isEditMode}
                suppressContentEditableWarning={true}
                onKeyDown={(e) => onKeyDown(e, item)}
                onBlur={(e) => onUpdate(item.id, e.currentTarget.innerHTML)}
            />
            {/* Рекурсивный рендер вложенных списков */}
            {item.children?.map(childBlock => {
                if (childBlock.type === 'core/list') {
                    return (
                        <ListBlock
                            key={childBlock.id}
                            block={childBlock}
                            mode={mode}
                        />
                    );
                }
                return null;
            })}
        </li>
    );
});

ListBlock.blockStyles = styles;

const unorderedStyles = [
    { value: 'disc', label: '● Точка' },
    { value: 'circle', label: '○ Кружок' },
    { value: 'square', label: '■ Квадрат' },
    { value: 'dash', label: '- Тире' },
    { value: 'none', label: 'Без маркера' },
];
const orderedStyles = [
    { value: 'decimal', label: '1. Цифры' },
    { value: 'lower-alpha', label: 'a. Буквы' },
    { value: 'lower-roman', label: 'i. Римские' },
];

//================================================================================
// 2. "Паспорт" блока
//================================================================================
ListBlock.blockInfo = {
    type: 'core/list',
    label: 'Список',
    icon: <ListIcon />, // Предполагаем, что есть общая иконка ListIcon
    description: 'Создает маркированный или нумерованный список.',
    keywords: ['список', 'перечисление', 'пункты', 'list'],

    parent: null,
    // ВАЖНО: Этот блок может содержать только свои внутренние элементы,
    // но мы их не регистрируем как отдельные блоки, а храним в `children`.
    // Поэтому DND внутрь него должен быть отключен.
    isContainer: false,

    supports: {
        reusable: true,
        html: false,
    },

    transforms: {
        to: [{ type: 'block', block: 'core/text', label: 'Параграф' }],
        from: [{ type: 'block', block: 'core/text' }],
    },

    example: {
        props: { ordered: false },
        children: [
            { id: 'l1', type: 'core/list-item', content: 'Первый пункт', children: [] },
            { id: 'l2', type: 'core/list-item', content: 'Второй пункт', children: [] },
        ]
    },

    defaultData: () => ({
        type: 'core/list',
        props: { ordered: false }, // По умолчанию - маркированный
        // Вместо `content` используем `children` для хранения пунктов
        children: [
            { id: nanoid(), type: 'core/list-item', content: 'Первый пункт', children: [] },
        ],
        variants: {
            listStyleType: 'disc', // Стиль маркера по умолчанию
        },
        styles: {},
    }),

    supportedVariants: {
        listStyleType: {
            label: "Стиль маркеров",
            options: {
                unordered: unorderedStyles,
                ordered: orderedStyles,
            }
        }
    },

    getToolbarItems: ({ block, actions }) => {
        const { props = {} } = block;

        const setOrdered = (isOrdered) => {
            actions.update(block.id, { props: { ...props, ordered: isOrdered } });
        };

        return (
            <div className="toolbarButtonGroup">
                <ToolbarButton title="Маркированный список" isActive={!props.ordered} onClick={() => setOrdered(false)}>
                    <ListUnorderedIcon />
                </ToolbarButton>
                <ToolbarButton title="Нумерованный список" isActive={!!props.ordered} onClick={() => setOrdered(true)}>
                    <ListOrderedIcon />
                </ToolbarButton>
            </div>
        );
    },

    getEditor: ({ block, onChange }, helpers) => {
        const { props = {}, variants = {} } = block;

        // В зависимости от типа списка (ul/ol) показываем разные варианты маркеров
        const styleOptions = props.ordered
            ? ListBlock.blockInfo.supportedVariants.listStyleType.options.ordered
            : ListBlock.blockInfo.supportedVariants.listStyleType.options.unordered;

        // При смене типа списка (ul/ol) сбрасываем стиль маркера на дефолтный
        const handleListTypeChange = (isOrdered) => {
            const defaultStyle = isOrdered ? 'decimal' : 'disc';
            onChange({
                props: { ...props, ordered: isOrdered },
                variants: { ...variants, listStyleType: defaultStyle }
            });
        };

        return (
            <Tabs>
                <Tab title="Настройки">
                    <h4>Тип списка</h4>
                    <div className={styles.editorGroup}>
                        <ToolbarButton title="Маркированный список" isActive={!props.ordered} onClick={() => handleListTypeChange(false)}>
                            <ListUnorderedIcon />
                        </ToolbarButton>
                        <ToolbarButton title="Нумерованный список" isActive={!!props.ordered} onClick={() => handleListTypeChange(true)}>
                            <ListOrderedIcon />
                        </ToolbarButton>
                    </div>
                    <hr />
                    <h4>Стиль маркеров</h4>
                    <PresetSelector
                        options={styleOptions}
                        value={variants.listStyleType || 'disc'}
                        onChange={(val) => helpers.updateVariant('listStyleType', val)}
                    />
                </Tab>
            </Tabs>
        );
    }
};

export default withBlock(ListBlock);