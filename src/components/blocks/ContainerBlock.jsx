import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import classNames from 'classnames';
import styles from './ContainerBlock.module.css';
import { withBlock } from '../../hocs/withBlock';

// --- ВОССТАНОВЛЕННЫЕ ИМПОРТЫ ---
import Tabs from '../../ui/Tabs';
import Tab from '../../ui/Tab';
import Select from '../../ui/Select';
import ColorPicker from '../../ui/ColorPicker';
import ToolbarButton from '../../ui/ToolbarButton';
import CustomUnitInput from '../../ui/CustomUnitInput';
import PresetSelector from '../../ui/PresetSelector';
import {
    ContainerIcon, ContentWidthIcon, FullWidthIcon, LayoutColumnIcon, LayoutRowIcon, WideWidthIcon,
    AlignItemsStartIcon, AlignItemsCenterIcon, AlignItemsEndIcon, AlignItemsStretchIcon
} from '../../utils/icons';
import Checkbox from '../../ui/Checkbox';
import Input from '../../ui/Input';

const ContainerBlock = forwardRef(({ block, children, containerDropRef, isContainerOver, className, style, ...rest }, ref) => {
    const { props = {}, styles: blockStyles = {}, variants = {} } = block;
    const Tag = props.as || 'div';
    const hasChildren = React.Children.count(children) > 0;

    const inlineStyles = {
        ...blockStyles,
        ...style,
    };

    // Объединяем свои классы и классы от HOC
    const finalClasses = classNames(
        styles.container,
        className, // Классы от HOC
        {
            // Добавляем классы на основе вариантов (variants)
            [styles[`variant-align-${variants.align}`]]: variants.align,
            [styles[`variant-direction-${variants.direction}`]]: variants.direction,
            [styles[`variant-justifyContent-${variants.justifyContent}`]]: variants.justifyContent,
            [styles[`variant-alignItems-${variants.alignItems}`]]: variants.alignItems,
            [styles['variant-allowWrap-true']]: variants.allowWrap,
        }
    );

    const MotionTag = motion[Tag] || motion.div;

    return (
        // 2. Передаем `...rest` на финальный тег. Здесь "живут" onClick, onMouseDown и т.д.
        <MotionTag ref={ref} className={finalClasses} style={inlineStyles} {...rest}>
            {hasChildren ? (
                children
            ) : (
                <div ref={containerDropRef} className={`${styles.emptyDropZone} ${isContainerOver ? styles.isOver : ''}`}>
                    Перетащите блок сюда
                </div>
            )}
        </MotionTag>
    );
});

ContainerBlock.blockStyles = styles;

ContainerBlock.blockInfo = {
    type: 'core/container',
    label: 'Контейнер',
    icon: <ContainerIcon />,
    isContainer: true,
    // --- 1. Улучшение поиска и добавления (новые поля) ---
    description: 'Основной строительный блок для группировки и компоновки других элементов.',
    keywords: ['секция', 'обертка', 'группа', 'ряд', 'колонка', 'wrapper', 'group'],

    layoutDirection: (block) => block.variants?.direction || 'column',

    // --- 2. Правила вложенности (уже есть) ---
    parent: null, // Может находиться где угодно
    allowedBlocks: null, // Может содержать любые блоки

    // --- 3. Поддержка функций редактора (новое поле) ---
    supports: {
        // Разрешаем делать этот блок многоразовым (reusable)
        reusable: true,
        // Разрешаем добавлять HTML-якорь для ссылок
        anchor: true,
        // Разрешаем пользователю добавлять свои CSS-классы
        customClassName: true,
        // Запрещаем прямое редактирование HTML, т.к. он содержит другие блоки
        html: false,
    },

    // --- 4. Трансформации (новое поле) ---
    transforms: {
        // Контейнер можно создать, сгруппировав несколько любых блоков
        from: [
            {
                type: 'blocks',
                blocks: ['*'], // '*' означает любые блоки
                // В будущем здесь будет функция, которая объединяет выбранные блоки в контейнер
                transform: (blocks) => ({
                    type: 'core/container',
                    children: blocks,
                }),
            }
        ],
        // Пока неясно, во что можно осмысленно превратить контейнер, поэтому оставим пустым
        to: [],
    },

    // --- 5. Пример для превью в сайдбаре (новое поле) ---
    example: {
        children: [
            {
                type: 'core/text',
                content: 'Это пример того, как выглядит контейнер с контентом внутри.',
            }
        ],
        variants: {
            align: 'none',
            direction: 'row',
            alignItems: 'center',
        },
        styles: {
            backgroundColor: '#f9fafb',
            padding: '24px',
            gap: '16px',
        }
    },

    defaultData: () => ({
        type: 'core/container',
        children: [],
        variants: {
            align: 'none',
            direction: 'column',
            justifyContent: 'flex-start',
            alignItems: 'stretch',
            allowWrap: false,
        },
        props: { as: 'div' },
        styles: {},
    }),
    supportedVariants: {
        align: {
            label: 'Ширина блока',
            options: [
                { value: 'none', label: 'Контент', icon: <ContentWidthIcon /> },
                { value: 'wide', label: 'Широкая', icon: <WideWidthIcon /> },
                { value: 'full', label: 'Во всю ширину', icon: <FullWidthIcon /> },
            ],
        },
        direction: {
            label: 'Направление',
            options: [
                { value: 'column', label: 'Колонка', icon: <LayoutColumnIcon /> },
                { value: 'row', label: 'Ряд', icon: <LayoutRowIcon /> },
            ],
        },
        justifyContent: {
            label: 'Выравнивание по основной оси',
            options: [
                { value: 'flex-start', label: 'Начало' }, { value: 'center', label: 'Центр' },
                { value: 'flex-end', label: 'Конец' }, { value: 'space-between', label: 'Между' },
                { value: 'space-around', label: 'Равномерно' }, { value: 'space-evenly', label: 'С отступами' }
            ]
        },
        alignItems: {
            label: 'Выравнивание по поперечной оси',
            options: [
                { value: 'stretch', label: 'Растянуть', icon: <AlignItemsStretchIcon /> },
                { value: 'flex-start', label: 'Начало', icon: <AlignItemsStartIcon /> },
                { value: 'center', label: 'Центр', icon: <AlignItemsCenterIcon /> },
                { value: 'flex-end', label: 'Конец', icon: <AlignItemsEndIcon /> },
            ]
        },
        allowWrap: { label: 'Перенос элементов' },
    },
    getToolbarItems: ({ block, actions }) => {
        const { variants = {} } = block;
        const currentAlign = block.variants?.align || 'none';
        const currentDirection = variants.direction || 'column';

        const updateVariant = (variantName, newValue) => {
            actions.update(block.id, {
                variants: { ...block.variants, [variantName]: newValue },
            });
        };

        const nextDirection = currentDirection === 'column' ? 'row' : 'column';

        return [
            <div key="align-group" className="toolbarButtonGroup">
                <ToolbarButton title="Ширина контента" onClick={() => updateVariant('align', 'none')} isActive={currentAlign === 'none'}>
                    <ContentWidthIcon />
                </ToolbarButton>
                <ToolbarButton title="Широкая ширина" onClick={() => updateVariant('align', 'wide')} isActive={currentAlign === 'wide'}>
                    <WideWidthIcon />
                </ToolbarButton>
                <ToolbarButton title="Во всю ширину" onClick={() => updateVariant('align', 'full')} isActive={currentAlign === 'full'}>
                    <FullWidthIcon />
                </ToolbarButton>
            </div>,
            <div key="separator" className="toolbarSeparator"></div>,
            <ToolbarButton key="direction" title={`Изменить на: ${nextDirection === 'row' ? 'Ряд' : 'Колонка'}`} onClick={() => updateVariant('direction', nextDirection)}>
                {currentDirection === 'column' ? <LayoutRowIcon /> : <LayoutColumnIcon />}
            </ToolbarButton>
        ];
    },
    getEditor: ({ block, onChange }) => {
        const { props = {}, styles = {}, variants = {} } = block;

        const handlePropsChange = (newProps) => onChange({ props: { ...props, ...newProps } });
        const handleStyleChange = (newStyles) => onChange({ styles: { ...styles, ...newStyles } });
        const handleVariantChange = (name, value) => onChange({ variants: { ...variants, [name]: value } });

        return (
            <Tabs>
                <Tab title="Компоновка">
                    <h4>Ширина блока</h4>
                    <PresetSelector options={ContainerBlock.blockInfo.supportedVariants.align.options} value={variants.align || 'none'} onChange={(val) => handleVariantChange('align', val)} />
                    <hr />
                    <h4>Направление Flexbox</h4>
                    <PresetSelector options={ContainerBlock.blockInfo.supportedVariants.direction.options} value={variants.direction || 'column'} onChange={(val) => handleVariantChange('direction', val)} />
                    <hr />
                    <h4>Выравнивание содержимого</h4>
                    <Select label="По основной оси" options={ContainerBlock.blockInfo.supportedVariants.justifyContent.options} value={variants.justifyContent || 'flex-start'} onChange={(val) => handleVariantChange('justifyContent', val)} />
                    <Select label="По поперечной оси" options={ContainerBlock.blockInfo.supportedVariants.alignItems.options} value={variants.alignItems || 'stretch'} onChange={(val) => handleVariantChange('alignItems', val)} />
                    <Checkbox label="Разрешить перенос на несколько строк" checked={!!variants.allowWrap} onChange={(e) => handleVariantChange('allowWrap', e.target.checked)} />
                </Tab>

                <Tab title="Стили">
                    <h4>Фон</h4>
                    <ColorPicker label="Цвет фона" value={styles.backgroundColor || ''} onChange={(color) => handleStyleChange({ backgroundColor: color })} />
                    <ColorPicker label="Цвет текста" value={styles.color || ''} onChange={(color) => handleStyleChange({ color: color })} />
                    <hr />
                    <h4>Отступы</h4>
                    <CustomUnitInput label="Внешние (margin)" value={styles.margin || ''} onChange={(val) => handleStyleChange({ margin: val })} />
                    <CustomUnitInput label="Внутренние (padding)" value={styles.padding || ''} onChange={(val) => handleStyleChange({ padding: val })} />
                    <CustomUnitInput label="Промежуток (gap)" value={styles.gap || ''} onChange={(val) => handleStyleChange({ gap: val })} />
                    <hr />
                    <h4>Размеры</h4>
                    <CustomUnitInput label="Мин. высота (min-height)" value={styles.minHeight || ''} onChange={(val) => handleStyleChange({ minHeight: val })} />
                    <CustomUnitInput label="Макс. ширина (max-width)" value={styles.maxWidth || ''} onChange={(val) => handleStyleChange({ maxWidth: val })} />
                    <hr />
                    <h4>Границы и тени</h4>
                    <CustomUnitInput label="Скругление (radius)" value={styles.borderRadius || ''} onChange={(val) => handleStyleChange({ borderRadius: val })} />
                    <Input label="Граница (border)" placeholder="1px solid #ccc" value={styles.border || ''} onChange={(e) => handleStyleChange({ border: e.target.value })} />
                    <Input label="Тень (box-shadow)" placeholder="0 2px 10px rgba(0,0,0,0.1)" value={styles.boxShadow || ''} onChange={(e) => handleStyleChange({ boxShadow: e.target.value })} />
                </Tab>

                <Tab title="Дополнительно">
                    <Select label="HTML-тег" value={props.as || 'div'} options={[{ label: 'div', value: 'div' }, { label: 'section', value: 'section' }, { label: 'header', value: 'header' }, { label: 'footer', value: 'footer' }]} onChange={(val) => handlePropsChange({ as: val })} />
                    <Input label="HTML-якорь (ID)" value={props.id || ''} onChange={(e) => handlePropsChange({ id: e.target.value })} />
                    <Input label="Дополнительные CSS-классы" value={props.className || ''} onChange={(e) => handlePropsChange({ className: e.target.value })} />
                </Tab>
            </Tabs>
        );
    },
};

export default withBlock(ContainerBlock);