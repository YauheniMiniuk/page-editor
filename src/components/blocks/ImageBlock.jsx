import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import styles from './ImageBlock.module.css';
import { withBlockFeatures } from '../../hocs/withBlockFeatures';

// Импорты для инспектора и тулбара
import Tabs from '../../ui/Tabs';
import Tab from '../../ui/Tab';
import Input from '../../ui/Input';
import PresetSelector from '../../ui/PresetSelector';
import CustomUnitInput from '../../ui/CustomUnitInput';
import ToolbarButton from '../../ui/ToolbarButton';
import ColorPicker from '../../ui/ColorPicker';
import { ImageIcon, ContentWidthIcon, WideWidthIcon, FullWidthIcon } from '../../utils/icons';
import Checkbox from '../../ui/Checkbox';


// 1. АРХИТЕКТУРА: Компонент стал "глупым", принимает готовый className и ref
const ImageBlock = forwardRef(({ block, className, ...restProps }, ref) => {
  const { props = {}, styles: inlineStyles = {} } = block;

  const finalClasses = [
    styles.figure,
    className,
    props.stretchToParent ? styles.isStretchedToParent : '',
  ].filter(Boolean).join(' ');

  // 2. РЕНДЕРИНГ: Собираем инлайн-стили и готовим изображение
  const imageElement = (
    <img
      src={props.src || 'https://via.placeholder.com/600x400?text=Image'}
      alt={props.alt || ''}
      className={styles.image}
    />
  );

  // 2.1. Если есть ссылка, оборачиваем изображение в тег <a>
  const imageWithLink = props.href ? (
    <a href={props.href} target="_blank" rel="noopener noreferrer">
      {imageElement}
    </a>
  ) : imageElement;

  return (
    <motion.figure
      ref={ref}
      className={finalClasses}
      style={inlineStyles}
      {...restProps}
    >
      {imageWithLink}
      {props.caption && (
        <figcaption className={styles.caption} contentEditable suppressContentEditableWarning>
          {props.caption}
        </figcaption>
      )}
    </motion.figure>
  );
});

ImageBlock.blockInfo = {
  type: 'core/image',
  label: 'Изображение',
  icon: <ImageIcon />,

  defaultData: {
    type: 'core/image',
    props: { src: '', alt: 'Замещающий текст', caption: '', href: '' },
    variants: { align: 'none' }, // Теперь align - это ширина (none, wide, full)
    styles: {},
  },

  supportedVariants: {
    align: {
      label: 'Выравнивание блока',
      options: [
        { value: 'none', label: 'Контент', icon: <ContentWidthIcon /> },
        { value: 'wide', label: 'Широкая', icon: <WideWidthIcon /> },
        { value: 'full', label: 'Во всю ширину', icon: <FullWidthIcon /> },
      ],
      defaultValue: 'none',
    },
    shape: {
      label: 'Форма',
      options: [
        { value: 'default', label: 'Прямоугольник' },
        { value: 'rounded', label: 'Скругление' },
        { value: 'circle', label: 'Круг' }
      ],
      defaultValue: 'default',
    }
  },

  // 3. ТУЛБАР: Добавляем управление выравниванием (шириной)
  getToolbarItems: ({ block, actions }) => {
    const updateVariant = (name, value) => {
      actions.update(block.id, { variants: { ...block.variants, [name]: value } });
    };

    return [
      <div key="align-group" className="toolbarButtonGroup">
        {ImageBlock.blockInfo.supportedVariants.align.options.map(opt => (
          <ToolbarButton
            key={opt.value}
            title={opt.label}
            isActive={(block.variants?.align || 'none') === opt.value}
            onClick={() => updateVariant('align', opt.value)}
          >
            {opt.icon}
          </ToolbarButton>
        ))}
      </div>
    ];
  },

  // 4. ИНСПЕКТОР: Добавляем новые настройки
  getEditor: ({ block, onChange }, helpers) => {
    const { props = {}, styles = {} } = block;
    const handlePropsChange = (newProps) => onChange({ props: { ...props, ...newProps } });
    const handleStyleChange = (newStyles) => onChange({ styles: { ...styles, ...newStyles } });

    return (
      <Tabs>
        <Tab title="Настройки">
          <h4>Источник</h4>
          <Input label="URL изображения" value={props.src} onChange={(e) => handlePropsChange({ src: e.target.value })} />
          <Input label="Alt текст" value={props.alt} onChange={(e) => handlePropsChange({ alt: e.target.value })} />
          <Input label="Подпись" value={props.caption} onChange={(e) => handlePropsChange({ caption: e.target.value })} />
          <hr />
          <h4>Ссылка</h4>
          <Input label="URL ссылки" placeholder="https://example.com" value={props.href} onChange={(e) => handlePropsChange({ href: e.target.value })} />
        </Tab>
        <Tab title="Стили">
          <h4>Размеры</h4>
          <Checkbox
            label="Растянуть на ширину родителя"
            checked={!!props.stretchToParent}
            onChange={(e) => handlePropsChange({ stretchToParent: e.target.checked })}
          />
          <CustomUnitInput
            label="Ширина"
            value={styles.width || ''}
            onChange={(val) => handleStyleChange({ width: val })}
          />
          <CustomUnitInput
            label="Высота"
            value={styles.height || ''}
            onChange={(val) => handleStyleChange({ height: val })}
          />
          <hr />
          <h4>Оформление</h4>
          <label>Форма</label>
          <PresetSelector
            options={ImageBlock.blockInfo.supportedVariants.shape.options}
            value={block.variants?.shape || 'default'}
            onChange={(val) => helpers.updateVariant('shape', val)}
          />
          <hr />
          <h4>Рамка</h4>
          <CustomUnitInput
            label="Толщина рамки"
            value={styles.borderWidth || ''}
            onChange={(val) => handleStyleChange({ borderWidth: val })}
          />
          <ColorPicker
            label="Цвет рамки"
            value={styles.borderColor || ''}
            onChange={(color) => handleStyleChange({ borderColor: color, borderStyle: color ? 'solid' : 'none' })}
          />
        </Tab>
      </Tabs>
    );
  }
};

// 5. АРХИТЕКТУРА: Экспортируем компонент, обернутый в HOC
export default withBlockFeatures(ImageBlock, styles);