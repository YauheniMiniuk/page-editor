import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import classNames from 'classnames';

import styles from './ImageBlock.module.css';
import { withBlock } from '../../hocs/withBlock';

// --- UI и иконки ---
import Tabs from '../../ui/Tabs';
import Tab from '../../ui/Tab';
import Input from '../../ui/Input';
import PresetSelector from '../../ui/PresetSelector';
import CustomUnitInput from '../../ui/CustomUnitInput';
import ToolbarButton from '../../ui/ToolbarButton';
import ColorPicker from '../../ui/ColorPicker';
import { ImageIcon, ContentWidthIcon, WideWidthIcon, FullWidthIcon } from '../../utils/icons';
import Checkbox from '../../ui/Checkbox';

//================================================================================
// 1. Компонент блока "Изображение"
//================================================================================
const ImageBlock = forwardRef(({ block, mode, className, style, actions, ...rest }, ref) => {
  const { props = {}, styles: inlineStyles = {} } = block;
  const isEditMode = mode === 'edit';

  const finalClasses = classNames(styles.figure, className);
  const finalStyles = { ...inlineStyles, ...style };

  // Обработчик для редактирования подписи
  const handleCaptionBlur = (e) => {
    if (isEditMode && actions) {
      const newCaption = e.currentTarget.textContent;
      if (newCaption !== props.caption) {
        actions.update(block.id, { props: { ...props, caption: newCaption } });
      }
    }
  };

  // Если нет картинки и мы в режиме редактирования - показываем плейсхолдер
  if (!props.src && isEditMode) {
    return (
      <div ref={ref} className={classNames(finalClasses, styles.placeholder)} style={finalStyles} {...rest}>
        <ImageIcon />
        <span>Выберите изображение</span>
      </div>
    );
  }

  // Рендерим изображение
  const imageElement = (
    <img
      src={props.src}
      alt={props.alt || ''}
      className={styles.image}
      onError={(e) => { e.target.style.display = 'none'; /* Можно добавить и плейсхолдер на случай битой ссылки */ }}
    />
  );

  // Оборачиваем в ссылку, если она есть
  const imageWithLink = props.href && !isEditMode ? (
    <a href={props.href} target="_blank" rel="noopener noreferrer">
      {imageElement}
    </a>
  ) : imageElement;

  return (
    <motion.figure ref={ref} className={finalClasses} style={finalStyles} {...rest}>
      {imageWithLink}
      {(props.caption || isEditMode) && (
        <figcaption
          className={styles.caption}
          // Включаем редактирование подписи
          contentEditable={isEditMode}
          suppressContentEditableWarning={true}
          onBlur={handleCaptionBlur}
          // Чтобы при клике на подпись не выделялся весь блок
          onMouseDown={isEditMode ? e => e.stopPropagation() : undefined}
          // Показываем плейсхолдер, если подписи нет
          data-placeholder={!props.caption ? "Добавить подпись" : ""}
        >
          {props.caption}
        </figcaption>
      )}
    </motion.figure>
  );
});

ImageBlock.blockStyles = styles;

//================================================================================
// 2. "Паспорт" блока
//================================================================================
ImageBlock.blockInfo = {
  type: 'core/image',
  label: 'Изображение',
  icon: <ImageIcon />,
  isContainer: false,

  description: 'Вставляет изображение из медиатеки или по URL-адресу.',
  keywords: ['картинка', 'фото', 'медиа', 'picture', 'photo'],

  parent: null,
  allowedBlocks: [],

  supports: {
    reusable: true,
    anchor: true,
    customClassName: true,
    html: false,
  },

  transforms: {
    to: [{ type: 'block', block: 'core/container' }],
    from: [{ type: 'block', block: 'core/text' }], // Можно будет вставить URL и он превратится в картинку
  },

  example: {
    props: {
      src: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809',
      alt: 'Абстрактный градиент',
      caption: 'Красивый фон',
    },
    variants: { align: 'wide', shape: 'rounded' },
  },

  defaultData: () => ({
    type: 'core/image',
    props: { src: '', alt: 'Замещающий текст', caption: '', href: '' },
    variants: { align: 'none', shape: 'default' },
    styles: {},
  }),

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

export default withBlock(ImageBlock);