import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import styles from './ContainerBlock.module.css';

// Импортируем наши UI-компоненты
import Tabs from '../../ui/Tabs';
import Tab from '../../ui/Tab';
import Select from '../../ui/Select';
import ColorPicker from '../../ui/ColorPicker';
import ToolbarButton from '../../ui/ToolbarButton';
import CustomUnitInput from '../../ui/CustomUnitInput';
import PresetSelector from '../../ui/PresetSelector'; // FIX 3: Импортируем PresetSelector

// Импортируем иконки
import {
  ContainerIcon, ContentWidthIcon, FullWidthIcon, LayoutColumnIcon, LayoutRowIcon, WideWidthIcon,
  AlignItemsStartIcon, AlignItemsCenterIcon, AlignItemsEndIcon, AlignItemsStretchIcon
} from '../../utils/icons';
import { withBlockFeatures } from '../../hocs/withBlockFeatures';
import { withContainer } from '../../hocs/withContainer';

const ContainerBlock = forwardRef(({ block, children, mode, className, ...restProps }, ref) => {
    const { props = {}, styles: blockStyles = {} } = block;
    const Tag = props.as || 'div';

    const inlineStyles = {
        ...blockStyles,
        display: 'flex',
        flexDirection: block.variants?.direction || 'column',
        justifyContent: block.variants?.justifyContent || 'flex-start',
        alignItems: block.variants?.alignItems || 'stretch',
        minHeight: '80px', // Важно оставить минимальную высоту для пустого контейнера
    };

    const finalClasses = [
        styles.container,
        className,
    ].filter(Boolean).join(' ');

    const MotionTag = motion[Tag] || motion.div;

    // --- ЛОГИКА УПРОСТИЛАСЬ ---
    // Больше нет проверки на hasChildren и isEditMode.
    // Просто рендерим компонент и его детей. HOC сделает остальное.
    return (
        <MotionTag ref={ref} className={finalClasses} style={inlineStyles} {...restProps}>
            {children}
        </MotionTag>
    );
});

ContainerBlock.blockInfo = {
  type: 'core/container',
  label: 'Контейнер',
  icon: <ContainerIcon />,
  isContainer: true,

  defaultData: {
    type: 'core/container',
    children: [],
    variants: {
      align: 'none',
      direction: 'column',
      justifyContent: 'flex-start',
      alignItems: 'stretch',
    },
    props: { as: 'div' },
    styles: {},
  },

  supportedVariants: {
    align: {
      label: 'Ширина блока', // Более понятный лейбл
      options: [
        // FIX 3: Заменяем текстовые иконки на реальные компоненты
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
        { value: 'flex-start', label: 'Начало' },
        { value: 'center', label: 'Центр' },
        { value: 'flex-end', label: 'Конец' },
        { value: 'space-between', label: 'Между' },
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
    }
  },

  getToolbarItems: ({ block, actions }) => {
    const { variants = {} } = block;
    const currentAlign = block.variants?.align || 'none';
    const currentDirection = variants.direction || 'column';

    // Функция-помощник для обновления варианта
    const updateVariant = (variantName, newValue) => {
      actions.update(block.id, {
        variants: { ...block.variants, [variantName]: newValue },
      });
    };

    const nextDirection = currentDirection === 'column' ? 'row' : 'column';

    return [
      <div key="align-group" className="toolbarButtonGroup">
        <ToolbarButton
          title="Ширина контента"
          onClick={() => updateVariant('align', 'none')}
          isActive={currentAlign === 'none'}
        >
          <ContentWidthIcon />
        </ToolbarButton>
        <ToolbarButton
          title="Широкая ширина"
          onClick={() => updateVariant('align', 'wide')}
          isActive={currentAlign === 'wide'}
        >
          <WideWidthIcon />
        </ToolbarButton>
        <ToolbarButton
          title="Во всю ширину"
          onClick={() => updateVariant('align', 'full')}
          isActive={currentAlign === 'full'}
        >
          <FullWidthIcon />
        </ToolbarButton>
      </div>,

      <div key="separator" className="toolbarSeparator"></div>,

      <ToolbarButton
        key="direction"
        title={`Изменить на: ${nextDirection === 'row' ? 'Ряд' : 'Колонка'}`}
        onClick={() => updateVariant('direction', nextDirection)}
      >
        {currentDirection === 'column' ? <LayoutRowIcon /> : <LayoutColumnIcon />}
      </ToolbarButton>
    ];
  },

  getEditor: ({ block, onChange }, helpers) => {
    const { props = {}, styles = {}, variants = {} } = block;

    // FIX 1: Исправляем обработчики. Они должны принимать чистое значение, а не event.
    // Также исправлен баг, `styles` нужно брать из `block.styles`.
    const handlePropsChange = (newProps) => onChange({ props: { ...props, ...newProps } });
    const handleStyleChange = (newStyles) => onChange({ styles: { ...(block.styles || {}), ...newStyles } });
    const updateVariant = (name, value) => helpers.updateVariant(name, value);

    const currentDirection = variants.direction || 'column';

    // FIX 2: Создаем динамические подписи для осей
    const axisLabels = {
      main: currentDirection === 'column' ? 'По вертикали' : 'По горизонтали',
      cross: currentDirection === 'column' ? 'По горизонтали' : 'По вертикали',
    };

    const userPresets = [
    '#264653', '#2a9d8f', '#e9c46a', '#f4a261', '#e76f51',
    '#ffffff', '#000000'
  ];

    return (
      <Tabs>
        <Tab title="Компоновка">
          <h4>{ContainerBlock.blockInfo.supportedVariants.align.label}</h4>
          {/* FIX 3: Заменяем кнопки на PresetSelector */}
          <PresetSelector
            options={ContainerBlock.blockInfo.supportedVariants.align.options}
            value={variants.align || 'none'}
            onChange={(newValue) => updateVariant('align', newValue)}
          />
          <hr />
          <h4>{ContainerBlock.blockInfo.supportedVariants.direction.label}</h4>
          {/* FIX 3: И здесь тоже */}
          <PresetSelector
            options={ContainerBlock.blockInfo.supportedVariants.direction.options}
            value={currentDirection}
            onChange={(newValue) => updateVariant('direction', newValue)}
          />
          <hr />
          <h4>Выравнивание содержимого</h4>
          {/* FIX 2: Используем динамические подписи */}
          <Select
            label={axisLabels.main}
            options={ContainerBlock.blockInfo.supportedVariants.justifyContent.options}
            value={variants.justifyContent || 'flex-start'}
            onChange={(newValue) => updateVariant('justifyContent', newValue)}
          />
          <Select
            label={axisLabels.cross}
            options={ContainerBlock.blockInfo.supportedVariants.alignItems.options}
            value={variants.alignItems || 'stretch'}
            onChange={(newValue) => updateVariant('alignItems', newValue)}
          />
        </Tab>

        <Tab title="Стили">
          <h4>Цвета</h4>
          {/* FIX 1: Упрощаем onChange */}
          <ColorPicker
            label="Цвет фона"
            value={styles?.backgroundColor || ''}
            onChange={(color) => handleStyleChange({ backgroundColor: color })}
            presetColors={userPresets}
            
          />
          <ColorPicker
            label="Цвет текста"
            value={styles?.color || ''}
            onChange={(color) => handleStyleChange({ color: color })}
            presetColors={userPresets}
          />
          <hr />
          <h4>Отступы</h4>
          <div>
            <label>Промежуток (gap)</label>
            <CustomUnitInput
              value={styles?.gap || ''}
              onChange={(newValue) => handleStyleChange({ gap: newValue })}
            />
          </div>
          <div>
            <label>Внутренние отступы (padding)</label>
            <CustomUnitInput
              value={styles?.padding || ''}
              onChange={(newValue) => handleStyleChange({ padding: newValue })}
            />
          </div>
        </Tab>
        <Tab title="Дополнительно">
          <h4>HTML-тег</h4>
          <Select
            label="Тег"
            value={props.as || 'div'}
            options={[
              { label: 'div', value: 'div' },
              { label: 'section', value: 'section' },
            ]}
            onChange={(val) => handlePropsChange({ as: val })}
          />
        </Tab>
      </Tabs>
    );
  },
};

export default withBlockFeatures(withContainer(ContainerBlock, styles), styles);