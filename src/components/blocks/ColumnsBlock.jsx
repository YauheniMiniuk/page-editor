import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { nanoid } from 'nanoid';
import classNames from 'classnames';
import styles from './ColumnsBlock.module.css';

// --- HOC ---
import { withBlock } from '../../hocs/withBlock';

// --- UI и иконки ---
import Tabs from '../../ui/Tabs';
import Tab from '../../ui/Tab';
import Select from '../../ui/Select';
import ToolbarButton from '../../ui/ToolbarButton';
import CustomUnitInput from '../../ui/CustomUnitInput';
import PresetSelector from '../../ui/PresetSelector';
import { ColumnsIcon, Columns2Icon, Columns3Icon, Columns4Icon, AlignItemsStartIcon, AlignItemsCenterIcon, AlignItemsEndIcon, AlignItemsStretchIcon } from '../../utils/icons';
import Checkbox from '../../ui/Checkbox';

//================================================================================
// 1. Дочерний компонент для ОДНОЙ колонки
//================================================================================
const ColumnBlock = forwardRef(({ block, children, mode, className, style, ...rest }, ref) => {
  const isEditMode = mode === 'edit';
  const hasChildren = React.Children.count(children) > 0;

  const finalClasses = classNames(
    styles.column,
    className,
    isEditMode && !hasChildren && styles.isEmpty,
  );

  const finalStyles = { ...block.styles, ...style };

  return (
    <div ref={ref} className={finalClasses} style={finalStyles} {...rest}>
      {hasChildren ? children : (
        isEditMode && <div className={styles.emptyDropZone}>Перетащите блок сюда</div>
      )}
    </div>
  );
});


//================================================================================
// 2. Родительский компонент-обертка для ВСЕХ колонок
//================================================================================
const ColumnsBlock = forwardRef(({ block, children, className, style, ...rest }, ref) => {
  const { variants = {}, styles: blockStyles = {} } = block;

  const finalStyles = {
    ...blockStyles,
    ...style,
    gap: variants.gap || '2rem',
    alignItems: variants.verticalAlign || 'flex-start',
  };

  return (
    <motion.div ref={ref} className={classNames(styles.columnsWrapper, className)} style={finalStyles} {...rest}>
      {children}
    </motion.div>
  );
});


//================================================================================
// 3. Конфигурация для редактора
//================================================================================

// --- Конфиг для ОДНОЙ Колонки (core/column) ---
ColumnBlock.blockInfo = {
  type: 'core/column',
  label: 'Колонка',
  isContainer: true,
  parent: ['core/columns'],
  supports: { inserter: false, reusable: false },
  layoutDirection: (block) => block.variants?.direction || 'column',
  defaultData: () => ({
    type: 'core/column',
    children: [],
    props: {},
    // Изначально колонка гибкая, занимает 1 долю пространства
    styles: { flex: '1 1 0%' },
    variants: {},
  }),
  // --- ДОБАВЛЯЕМ НАСТРОЙКИ ДЛЯ ОДНОЙ КОЛОНКИ ---
  supportedVariants: {
    // Пока нет вариантов, но свойство должно быть, чтобы не было ошибки
  },
  getToolbarItems: () => {
    // Можно добавить кнопки для управления шириной, например
    return null;
  },
  getEditor: ({ block, onChange }) => {
    const { styles = {} } = block;

    const handleStyleChange = (newStyles) => {
      onChange({ styles: { ...styles, ...newStyles } });
    };

    return (
      <Tabs>
        <Tab title="Компоновка">
          <h4>Ширина колонки</h4>
          <CustomUnitInput
            label="Ширина (width)"
            placeholder="Напр. 30% или 300px"
            value={styles.width || ''}
            onChange={(val) => handleStyleChange({ width: val, flex: val ? `0 0 ${val}` : '1 1 0%' })}
          />
          <CustomUnitInput
            label="Отступ (padding)"
            placeholder="Напр. 1rem"
            value={styles.padding || ''}
            onChange={(val) => handleStyleChange({ padding: val })}
          />
        </Tab>
      </Tabs>
    );
  }
};

// --- Конфиг для блока Колонок (core/columns) ---
ColumnsBlock.blockInfo = {
  type: 'core/columns',
  label: 'Колонки',
  icon: <ColumnsIcon />,
  isContainer: true,
  description: 'Разделяет контент на несколько вертикальных колонок.',
  keywords: ['сетка', 'grid', 'ряд', 'макет'],
  layoutDirection: 'row',

  parent: null,
  allowedBlocks: ['core/column'],
  supports: { reusable: true, anchor: true },

  defaultData: () => ({
    type: 'core/columns',
    // --- ИЗМЕНЕНИЕ: Добавляем вариант для адаптивности ---
    variants: {
      columns: 2,
      gap: '2rem',
      verticalAlign: 'flex-start',
      stackOnMobile: true, // По умолчанию складываем
    },
    styles: {},
    children: [
      { ...ColumnBlock.blockInfo.defaultData(), id: nanoid() },
      { ...ColumnBlock.blockInfo.defaultData(), id: nanoid() },
    ],
  }),
  supportedVariants: {
    columns: { label: 'Количество колонок' },
    gap: { label: 'Отступ между колонками' },
    verticalAlign: {
      label: 'Вертикальное выравнивание',
      options: [
        { value: 'flex-start', label: 'По верху', icon: <AlignItemsStartIcon /> },
        { value: 'center', label: 'По центру', icon: <AlignItemsCenterIcon /> },
        { value: 'flex-end', label: 'По низу', icon: <AlignItemsEndIcon /> },
        { value: 'stretch', label: 'Растянуть', icon: <AlignItemsStretchIcon /> },
      ],
    },
  },

  example: {
    variants: { columns: 3, gap: '1rem' },
    children: [
      { id: 'p1', type: 'core/column', children: [{ type: 'core/text', id: 't1', content: 'Текст в первой колонке.' }] },
      { id: 'p2', type: 'core/column', children: [{ type: 'core/text', id: 't2', content: 'Текст во второй колонке.' }] },
      { id: 'p3', type: 'core/column', children: [{ type: 'core/text', id: 't3', content: 'Текст в третьей колонке.' }] },
    ],
  },

  getToolbarItems: ({ block, actions }) => {
    const { variants = {} } = block;

    const handleColumnCountChange = (newCount) => {
      const currentChildren = block.children || [];
      const currentCount = currentChildren.length;
      let newChildren = [...currentChildren];

      if (newCount > currentCount) {
        // Добавляем новые колонки
        for (let i = 0; i < newCount - currentCount; i++) {
          newChildren.push({ ...ColumnBlock.blockInfo.defaultData(), id: nanoid() });
        }
      } else if (newCount < currentCount) {
        // "Отрезаем" лишние колонки вместе с контентом
        newChildren = newChildren.slice(0, newCount);
      }

      actions.update(block.id, {
        variants: { ...variants, columns: newCount },
        children: newChildren,
      });
    };

    return (
      <div className="toolbarButtonGroup">
        <ToolbarButton title="2 колонки" isActive={variants.columns === 2} onClick={() => handleColumnCountChange(2)}><Columns2Icon /></ToolbarButton>
        <ToolbarButton title="3 колонки" isActive={variants.columns === 3} onClick={() => handleColumnCountChange(3)}><Columns3Icon /></ToolbarButton>
        <ToolbarButton title="4 колонки" isActive={variants.columns === 4} onClick={() => handleColumnCountChange(4)}><Columns4Icon /></ToolbarButton>
      </div>
    );
  },

  getEditor: ({ block, onChange }, helpers) => {
    const { variants = {} } = block;
    const handleColumnCountChange = (newCount) => {
      const currentChildren = block.children || [];
      const currentCount = currentChildren.length;
      let newChildren = [...currentChildren];

      if (newCount > currentCount) {
        // Добавляем новые колонки (эта логика остается)
        for (let i = 0; i < newCount - currentCount; i++) {
          newChildren.push({ ...ColumnBlock.blockInfo.defaultData(), id: nanoid() });
        }
      } else if (newCount < currentCount) {
        // --- ИЗМЕНЕНИЕ: Просто "отрезаем" лишние колонки ---
        // Весь контент в них будет удален вместе с ними.
        newChildren = newChildren.slice(0, newCount);
      }

      onChange({
        variants: { ...variants, columns: newCount },
        children: newChildren,
      });
    };

    return (
      <Tabs>
        <Tab title="Компоновка">
          <h4>Количество колонок</h4>
          <Select
            value={variants.columns || 2}
            options={[{ value: 2, label: '2' }, { value: 3, label: '3' }, { value: 4, label: '4' }]}
            onChange={(val) => handleColumnCountChange(Number(val))}
          />
          {/* ... остальной код ... */}
          <hr />
          {/* --- ИЗМЕНЕНИЕ: Добавляем чекбокс для адаптивности --- */}
          <h4>Поведение на мобильных</h4>
          <Checkbox
            label="Складывать в столбик"
            checked={variants.stackOnMobile !== false} // Включено по умолчанию
            onChange={(e) => helpers.updateVariant('stackOnMobile', e.target.checked)}
          />
        </Tab>
      </Tabs>
    );
  },
};
//================================================================================
// 4. Экспорты
//================================================================================
ColumnsBlock.blockStyles = styles;
ColumnBlock.blockStyles = styles;

export const ColumnsBlockWrapped = withBlock(ColumnsBlock);
export const ColumnBlockWrapped = withBlock(ColumnBlock);

export default ColumnsBlockWrapped;