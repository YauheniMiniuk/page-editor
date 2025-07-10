import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import styles from './TextBlock.module.css';
import Tabs from '../../ui/Tabs';
import Tab from '../../ui/Tab';
import ColorPicker from '../../ui/ColorPicker';
import Checkbox from '../../ui/Checkbox';
import PresetOrCustomInput from '../../ui/PresetOrCustomInput';
import ToolbarButton from '../../ui/ToolbarButton';
import PresetSelector from '../../ui/PresetSelector';
import CustomUnitInput from '../../ui/CustomUnitInput';
import { AlignCenterIcon, AlignLeftIcon, AlignRightIcon, ParagraphIcon } from '../../utils/icons';
import { withBlockFeatures } from '../../hocs/withBlockFeatures';

const TextBlock = forwardRef(
  ({ block, mode, actions, className, isEditingText, onFocusOut, ...restProps }, ref) => {
    const { props = {}, content, styles: inlineStyles = {} } = block;
    const Tag = props.as || 'p';
    const MotionTag = motion[Tag] || motion.p;

    const finalClasses = [
      styles.text,
      className,
      props.hasDropCap ? styles.hasDropCap : '',
    ].filter(Boolean).join(' ');

    const handleSaveOnBlur = (e) => {
      if (actions && e.currentTarget.innerHTML !== content) {
        actions.update(block.id, { content: e.currentTarget.innerHTML });
      }
      if (onFocusOut) {
        onFocusOut(e);
      }
    };

    return (
      <MotionTag
        ref={ref}
        className={finalClasses}
        style={inlineStyles}
        contentEditable={mode === 'edit' && isEditingText}
        suppressContentEditableWarning={true}
        onBlur={handleSaveOnBlur}
        dangerouslySetInnerHTML={{ __html: content }}
        {...restProps}
      />
    );
  }
);

TextBlock.blockInfo = {
  type: 'core/text',
  label: 'Параграф',
  icon: <ParagraphIcon />,

  defaultData: {
    type: 'core/text',
    content: 'Это простой текстовый блок. Начните вводить текст...',
    props: { as: 'p', hasDropCap: false, anchor: '' },
    variants: { textAlign: 'left', fontSize: 'normal' },
    styles: {},
  },

  supportedVariants: {
    textAlign: {
      label: 'Выравнивание текста',
      options: [
        { value: 'left', label: 'Влево', icon: <AlignLeftIcon /> },
        { value: 'center', label: 'Центр', icon: <AlignCenterIcon /> },
        { value: 'right', label: 'Вправо', icon: <AlignRightIcon /> },
      ],
      defaultValue: 'left',
    },
    fontSize: {
      label: 'Размер шрифта',
      options: [
        { value: 'small', label: 'S' }, { value: 'normal', label: 'M' },
        { value: 'large', label: 'L' }, { value: 'huge', label: 'XL' },
      ],
      defaultValue: 'normal',
    },
    // FIX 1: Палитра цветов для селекторов
    textColor: {
      label: 'Цвет текста',
      options: [
        { value: 'primary', label: 'Акцент' },
        { value: 'secondary', label: 'Вторичный' }
      ],
    },
    backgroundColor: {
      label: 'Цвет фона',
      options: [
        { value: 'light-gray', label: 'Светло-серый' },
        { value: 'light-accent', label: 'Светлый акцент' }
      ],
    },
  },

  getToolbarItems: ({ block, actions }) => {
    const { variants = {} } = block;
    const updateVariant = (name, value) => actions.update(block.id, { variants: { ...variants, [name]: value } });

    const handleFormat = (e, command) => {
      e.preventDefault(); // Важно, чтобы блок не терял фокус
      document.execCommand(command, false, null);
    };

    const alignmentIcons = {
      left: <AlignLeftIcon />,
      center: <AlignCenterIcon />,
      right: <AlignRightIcon />,
    };

    return (
      <>
        <div className="toolbarButtonGroup">
          {TextBlock.blockInfo.supportedVariants.textAlign.options.map(opt => (
            <ToolbarButton
              key={opt.value}
              title={opt.label}
              isActive={(variants.textAlign || 'left') === opt.value}
              onClick={() => updateVariant('textAlign', opt.value)}
            >
              {/* Используем иконку из объекта */}
              {alignmentIcons[opt.value]}
            </ToolbarButton>
          ))}
        </div>

        <div className="toolbarSeparator"></div>

        <div className="toolbarButtonGroup">
          {/* 👇 Просто заменяем button на ToolbarButton */}
          <ToolbarButton title="Жирный" onMouseDown={(e) => handleFormat(e, 'bold')}>
            <b>B</b>
          </ToolbarButton>
          <ToolbarButton title="Курсив" onMouseDown={(e) => handleFormat(e, 'italic')}>
            <i>I</i>
          </ToolbarButton>
          <ToolbarButton title="Подчеркнутый" onMouseDown={(e) => handleFormat(e, 'underline')}>
            <u>U</u>
          </ToolbarButton>
        </div>
      </>
    );
  },

  getEditor: ({ block, onChange }, helpers) => {
    const { props = {}, styles = {}, variants = {} } = block;

    const updateVariants = (newVariants) => helpers.updateVariant(null, { ...variants, ...newVariants });
    const handlePropsChange = (newProps) => onChange({ props: { ...props, ...newProps } });
    const handleStyleChange = (newStyles) => onChange({ styles: { ...styles, ...newStyles } });

    // FIX 1: Единый обработчик для цвета
    const handleColorChange = (type, value, isFromPalette) => {
      if (isFromPalette) {
        // Если выбрали цвет из палитры, обновляем вариант и сбрасываем инлайн-стиль
        onChange({
          variants: { ...variants, [type]: value },
          styles: { ...styles, [type === 'textColor' ? 'color' : 'backgroundColor']: undefined },
        });
      } else {
        // Если выбрали кастомный цвет, сбрасываем вариант и ставим инлайн-стиль
        onChange({
          variants: { ...variants, [type]: undefined },
          styles: { ...styles, [type === 'textColor' ? 'color' : 'backgroundColor']: value },
        });
      }
    };

    // FIX 3: Логика для управления размером шрифта
    const handleFontSizeChange = (newValue) => {
      const isPreset = TextBlock.blockInfo.supportedVariants.fontSize.options.some(p => p.value === newValue);
      if (isPreset) {
        onChange({
          variants: { ...variants, fontSize: newValue },
          styles: { ...styles, fontSize: undefined }
        });
      } else {
        onChange({
          variants: { ...variants, fontSize: undefined },
          styles: { ...styles, fontSize: newValue }
        });
      }
    };

    return (
      <Tabs>
        <Tab title="Стили">
          <h4>Типографика</h4>
          <PresetOrCustomInput
            label="Размер шрифта"
            presets={TextBlock.blockInfo.supportedVariants.fontSize.options}
            value={variants.fontSize || styles.fontSize || ''}
            onChange={handleFontSizeChange}
          />
          <CustomUnitInput
            label="Высота строки"
            value={styles.lineHeight || ''}
            onChange={(val) => handleStyleChange({ lineHeight: val })}
            units={['', 'em', 'rem', 'px']}
          />
          <CustomUnitInput
            label="Межбуквенный интервал"
            value={styles.letterSpacing || ''}
            onChange={(val) => handleStyleChange({ letterSpacing: val })}
            units={['px', 'em', 'rem']}
          />
          <Checkbox
            label="Начать с буквицы"
            checked={!!props.hasDropCap}
            onChange={(e) => handlePropsChange({ hasDropCap: e.target.checked })}
          />
          <hr />
          <h4>Отступы</h4>
          <CustomUnitInput
            label="Внутренние отступы (padding)"
            value={styles.padding || ''}
            onChange={(val) => handleStyleChange({ padding: val })}
          />
        </Tab>
        <Tab title="Цвет">
          {/* FIX 1: Новый унифицированный контрол для цвета */}
          <h4>Цвет текста</h4>
          <PresetSelector
            options={TextBlock.blockInfo.supportedVariants.textColor.options}
            value={variants.textColor}
            onChange={(val) => handleColorChange('textColor', val, true)}
          />
          <ColorPicker
            label="Свой цвет"
            value={styles.color || ''}
            onChange={(color) => handleColorChange('textColor', color, false)}
          />
          <hr />
          <h4>Цвет фона</h4>
          <PresetSelector
            options={TextBlock.blockInfo.supportedVariants.backgroundColor.options}
            value={variants.backgroundColor}
            onChange={(val) => handleColorChange('backgroundColor', val, true)}
          />
          <ColorPicker
            label="Свой цвет"
            value={styles.backgroundColor || ''}
            onChange={(color) => handleColorChange('backgroundColor', color, false)}
          />
        </Tab>
        <Tab title="Дополнительно">
          {/* ... */}
        </Tab>
      </Tabs>
    );
  },
};

export default withBlockFeatures(TextBlock, styles);