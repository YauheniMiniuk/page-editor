import React, { forwardRef, useLayoutEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import classNames from 'classnames';

import styles from './HeadingBlock.module.css';
import { withBlock } from '../../hocs/withBlock';

// --- UI ---
import Tabs from '../../ui/Tabs';
import Tab from '../../ui/Tab';
import ToolbarButton from '../../ui/ToolbarButton';
import ColorPicker from '../../ui/ColorPicker';
import Select from '../../ui/Select';
import { HeadingIcon, AlignCenterIcon, AlignLeftIcon, AlignRightIcon } from '../../utils/icons';
import { useBlockManager } from '../../contexts/BlockManagementContext';
import ToolbarButtonGroup from '../../ui/ToolbarButtonGroup';

//================================================================================
// 1. Компонент блока "Заголовок"
//================================================================================
const HeadingBlock = forwardRef(({ block, mode, className, style, actions, isSelected, ...rest }, ref) => {
    const { props = {}, content = '' } = block;
    const level = props.level || 2;
    const MotionTag = motion[`h${level}`];
    const isEditMode = mode === 'edit';
    const contentRef = useRef(null); // Ref для внутреннего, редактируемого span

    const { isInlineEditing } = useBlockManager();

    // Безопасно обновляем контент, не сбрасывая курсор
    useLayoutEffect(() => {
        if (contentRef.current && !isInlineEditing && contentRef.current.innerHTML !== content) {
            contentRef.current.innerHTML = content;
        }
    }, [content, isInlineEditing]);

    const handleMouseDown = (e) => {
        if (isSelected && isEditMode) {
            actions.setInlineEditing(true);
        }
        // Передаем событие дальше в dnd-kit, но только для внешнего тега
        rest.onMouseDown?.(e);
    };

    const handleBlur = (e) => {
        const newContent = e.currentTarget.innerHTML;
        if (newContent !== content) {
            actions.update(block.id, { content: newContent });
        }
        actions.setInlineEditing(false);
    };

    return (
        // Внешний тег (h1, h2...). Он отвечает за перетаскивание и семантику.
        <MotionTag
            ref={ref} // Ref для тулбара
            className={classNames(styles.heading, styles[`h${level}`], className)}
            style={{ ...block.styles, ...style }}
            {...rest} // Пропсы от HOC (включая onMouseDown для dnd)
            onMouseDown={handleMouseDown}
        >
            {/* Внутренний span. Он отвечает за редактирование текста. */}
            <span
                ref={contentRef}
                contentEditable={isEditMode}
                suppressContentEditableWarning={true}
                onBlur={handleBlur}
                // Этот onMouseDown нужен, чтобы клик внутри span не считался кликом по MotionTag
                onMouseDown={(e) => e.stopPropagation()}
            />
        </MotionTag>
    );
});

HeadingBlock.blockStyles = styles;

//================================================================================
// 2. "Паспорт" блока
//================================================================================
HeadingBlock.blockInfo = {
    type: 'core/heading',
    label: 'Заголовок',
    icon: <HeadingIcon />,
    description: 'Добавляет заголовок для структурирования контента (H1-H6).',
    keywords: ['заголовок', 'подзаголовок', 'секция', 'title', 'header'],

    parent: null,
    allowedBlocks: [],

    supports: {
        reusable: true,
        anchor: true,
        html: false, // Редактируем как простой текст
    },

    transforms: {
        to: [{ type: 'block', block: 'core/text', label: 'Параграф' }],
        from: [{ type: 'block', block: 'core/text' }],
    },

    example: {
        content: 'Это пример заголовка',
        props: { level: 2 },
    },

    defaultData: () => ({
        type: 'core/heading',
        content: 'Текст заголовка',
        props: { level: 2 },
        variants: { textAlign: 'left' },
        styles: {},
    }),

    supportedVariants: {
        textAlign: {
            label: 'Выравнивание текста',
            options: [
                { value: 'left', label: 'Влево', icon: <AlignLeftIcon /> },
                { value: 'center', label: 'Центр', icon: <AlignCenterIcon /> },
                { value: 'right', label: 'Вправо', icon: <AlignRightIcon /> },
            ],
        },
    },

    getToolbarItems: ({ block, actions }) => {
        const { props = {}, variants = {} } = block;

        const createToolbarAction = (actionFn) => (e) => {
            e.preventDefault();
            e.stopPropagation();
            actionFn();
        };

        const updateLevel = (newLevel) => {
            const blockEl = document.querySelector(`[data-block-id="${block.id}"]`);
            if (!blockEl) return;
            const currentContent = blockEl.innerHTML;
            actions.update(block.id, {
                content: currentContent,
                props: { ...props, level: newLevel }
            });
        };
        const updateVariant = (name, value) => {
            actions.update(block.id, { variants: { ...variants, [name]: value } });
        };

        const handleFormat = (command) => {
            const blockEl = document.querySelector(`[data-block-id="${block.id}"]`);
            if (!blockEl) return;

            const selection = window.getSelection();
            const hadUserSelection = !selection.isCollapsed && blockEl.contains(selection.anchorNode);

            // --- РЕШЕНИЕ: Временно делаем блок редактируемым ---
            const wasEditable = blockEl.contentEditable === 'true';
            if (!wasEditable) {
                blockEl.contentEditable = true;
            }

            // Фокусируемся на элементе, чтобы выделение работало корректно
            blockEl.focus();

            // Если не было выделения, выделяем все
            if (!hadUserSelection) {
                const range = document.createRange();
                range.selectNodeContents(blockEl);
                selection.removeAllRanges();
                selection.addRange(range);
            }

            // Выполняем команду
            document.execCommand(command, false, null);

            // Синхронизируем состояние
            const newContent = blockEl.innerHTML;
            if (newContent !== block.content) {
                actions.update(block.id, { content: newContent });
            }

            // Возвращаем все как было
            if (!wasEditable) {
                blockEl.contentEditable = false;
            }
        };

        return (
            <>
                {/* Переключатель уровня заголовка */}
                <ToolbarButtonGroup>
                    {[1, 2, 3, 4, 5, 6].map(lvl => (
                        <ToolbarButton
                            key={lvl} title={`Заголовок ${lvl}`}
                            isActive={props.level === lvl}
                            onClick={createToolbarAction(() => updateLevel(lvl))}
                        >H{lvl}</ToolbarButton>
                    ))}
                </ToolbarButtonGroup>
                <div className="toolbarSeparator"></div>
                {/* Переключатель выравнивания */}
                <ToolbarButtonGroup>
                    {HeadingBlock.blockInfo.supportedVariants.textAlign.options.map(opt => (
                        <ToolbarButton
                            key={opt.value} title={opt.label}
                            isActive={(variants.textAlign || 'left') === opt.value}
                            onClick={createToolbarAction(() => updateVariant('textAlign', opt.value))}
                        >{opt.icon}</ToolbarButton>
                    ))}
                </ToolbarButtonGroup>
                <div className="toolbarSeparator"></div>
                {/* --- ДОБАВЛЯЕМ КНОПКИ ФОРМАТИРОВАНИЯ --- */}
                <ToolbarButtonGroup>
                    <ToolbarButton title="Жирный" onClick={createToolbarAction(() => handleFormat('bold'))}><b>B</b></ToolbarButton>
                    <ToolbarButton title="Курсив" onClick={createToolbarAction(() => handleFormat('italic'))}><i>I</i></ToolbarButton>
                    <ToolbarButton title="Подчеркнутый" onClick={createToolbarAction(() => handleFormat('underline'))}><u>U</u></ToolbarButton>
                </ToolbarButtonGroup>
            </>
        );
    },

    getEditor: ({ block, onChange }) => {
        const { props = {}, styles = {} } = block;

        return (
            <Tabs>
                <Tab title="Настройки">
                    <h4>Уровень заголовка</h4>
                    <Select
                        value={props.level || 2}
                        options={[1, 2, 3, 4, 5, 6].map(lvl => ({ value: lvl, label: `Заголовок ${lvl}` }))}
                        onChange={(val) => onChange({ props: { ...props, level: Number(val) } })}
                    />
                </Tab>
                <Tab title="Стили">
                    <h4>Цвет</h4>
                    <ColorPicker
                        label="Цвет текста"
                        value={styles.color || ''}
                        onChange={(color) => onChange({ styles: { ...styles, color } })}
                    />
                </Tab>
            </Tabs>
        );
    }
};

export default withBlock(HeadingBlock);