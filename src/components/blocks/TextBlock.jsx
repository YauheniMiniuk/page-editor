import React, { forwardRef, useLayoutEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import classNames from 'classnames';
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
import { withBlock } from '../../hocs/withBlock';
import { useInlineEditing } from '../../hooks/useInlineEditing';
import { useBlockManager } from '../../contexts/BlockManagementContext';
import { toggleStyle } from '../../utils/textUtils';
import Input from '../../ui/Input';

//================================================================================
// 1. Компонент TextBlock
//================================================================================
const TextBlock = forwardRef(({ block, actions, className, style, mode, isSelected, ...rest }, ref) => {
  const { props = {}, content } = block;
  const isEditMode = mode === 'edit';
  const MotionTag = motion[props.as || 'p'];
  const contentRef = useRef(null);

  const { isInlineEditing } = useBlockManager();
  const isCurrentlyEditing = isEditMode && isSelected && isInlineEditing;

  const mergeRefs = (node) => {
    contentRef.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) ref.current = node;
  };

  useLayoutEffect(() => {
    if (contentRef.current && !isCurrentlyEditing && contentRef.current.innerHTML !== content) {
      contentRef.current.innerHTML = content;
    }
  }, [content, isCurrentlyEditing]);

  // --- НОВЫЙ ОБРАБОТЧИК ---
  const handleMouseDown = (e) => {
    // Если кликаем на уже выделенный блок, сразу включаем режим редактирования
    if (isSelected && isEditMode) {
      actions.setInlineEditing(true);
    }
    // Передаем событие дальше стандартному обработчику из dnd-kit
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
    <MotionTag
      ref={mergeRefs}
      id={props.id || undefined}
      className={classNames(styles.text, { [styles.hasDropCap]: props.hasDropCap }, className)}
      style={{ ...block.styles, ...style }}
      onBlur={handleBlur}
      // Включаем редактирование всегда, когда блок выбран и активен флаг inline-editing
      contentEditable={isCurrentlyEditing}
      suppressContentEditableWarning={true}
      {...rest}
      // Перехватываем onMouseDown
      onMouseDown={handleMouseDown}
    />
  );
});

TextBlock.blockStyles = styles;

TextBlock.blockInfo = {
  // --- Основная информация ---
  type: 'core/text',
  label: 'Параграф',
  icon: <ParagraphIcon />,
  isContainer: false, // Это не контейнер

  // --- Поиск и добавление ---
  description: 'Основной блок для написания текста, основа любого контента.',
  keywords: ['текст', 'абзац', 'описание', 'paragraph'],

  // --- Правила вложенности ---
  parent: null, // Может находиться где угодно
  allowedBlocks: [], // Не может содержать другие блоки

  // --- Поддержка функций редактора ---
  supports: {
    reusable: true,
    anchor: true,
    customClassName: true,
    // Для текстового блока важно разрешить прямое редактирование HTML
    html: true,
  },

  // --- Трансформации ---
  transforms: {
    // Это самый "трансформируемый" блок
    to: [
      { type: 'block', block: 'core/heading', label: 'Заголовок' },
      // В будущем можно добавить 'core/list', 'core/quote' и т.д.
    ],
    from: [
      { type: 'block', block: 'core/heading' },
    ]
  },

  // --- Пример для превью ---
  example: {
    content: 'Это пример текстового блока. Его можно превратить в заголовок или список.',
    variants: {
      textAlign: 'center',
      fontSize: 'normal'
    },
  },

  // --- Данные по умолчанию (уже есть) ---
  defaultData: () => ({
    type: 'core/text',
    content: 'Это простой текстовый блок. Начните вводить текст...',
    props: {
      as: 'p',
      hasDropCap: false,
      id: '',
      className: '',
    },
    variants: { textAlign: 'left', fontSize: 'normal' },
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

    const createToolbarAction = (actionFn) => (e) => {
      e.preventDefault();
      e.stopPropagation();
      actionFn();
    };

    const handleUpdateVariant = (name, value) => {
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
              title={opt.label}
              isActive={(variants.textAlign || 'left') === opt.value}
              onClick={createToolbarAction(() => handleUpdateVariant('textAlign', opt.value))}
            >
              {alignmentIcons[opt.value]}
            </ToolbarButton>
          ))}
        </div>
        <div className="toolbarSeparator"></div>
        <div className="toolbarButtonGroup">
          <ToolbarButton title="Жирный" onClick={createToolbarAction(() => handleFormat('bold'))}><b>B</b></ToolbarButton>
          <ToolbarButton title="Курсив" onClick={createToolbarAction(() => handleFormat('italic'))}><i>I</i></ToolbarButton>
          <ToolbarButton title="Подчеркнутый" onClick={createToolbarAction(() => handleFormat('underline'))}><u>U</u></ToolbarButton>
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
            units={['px', 'em', 'rem',]}
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
          <h4>Геометрия и отступы</h4>
          <CustomUnitInput
            label="Внутренний отступ (padding)"
            value={styles.padding || ''}
            onChange={(val) => handleStyleChange({ padding: val })}
          />
          <CustomUnitInput
            label="Внешний отступ (margin)"
            value={styles.margin || ''}
            onChange={(val) => handleStyleChange({ margin: val })}
          />
          <CustomUnitInput
            label="Скругление углов"
            value={styles.borderRadius || ''}
            onChange={(val) => handleStyleChange({ borderRadius: val })}
            units={['px', '%']}
          />
          <Input
            label="Граница (border)"
            placeholder="e.g. 1px solid #000"
            value={styles.border || ''}
            onChange={(e) => handleStyleChange({ border: e.target.value })}
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
          {/* --- НОВАЯ СЕКЦИЯ: Дополнительно --- */}
          <Input
            label="HTML-якорь"
            placeholder="Например, section-1"
            value={props.id || ''}
            onChange={(e) => handlePropsChange({ id: e.target.value })}
            helpText="Позволяет создать прямую ссылку на этот блок."
          />
          <Input
            label="Дополнительные CSS-классы"
            placeholder="my-class another-class"
            value={props.className || ''}
            onChange={(e) => handlePropsChange({ className: e.target.value })}
            helpText="Для кастомной стилизации через CSS."
          />
        </Tab>
      </Tabs>
    );
  },
};

export default withBlock(TextBlock);