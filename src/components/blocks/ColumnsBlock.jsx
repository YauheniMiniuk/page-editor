import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { nanoid } from 'nanoid';
import styles from './ColumnsBlock.module.css';

// UI и иконки
import Tabs from '../../ui/Tabs';
import Tab from '../../ui/Tab';
import Select from '../../ui/Select';
import ToolbarButton from '../../ui/ToolbarButton';
import CustomUnitInput from '../../ui/CustomUnitInput';
import PresetSelector from '../../ui/PresetSelector';
import { Columns2Icon, Columns3Icon, Columns4Icon, AlignItemsStartIcon, AlignItemsCenterIcon, AlignItemsEndIcon, AlignItemsStretchIcon } from '../../utils/icons';
import { withBlockFeatures } from '../../hocs/withBlockFeatures';

// Дочерний компонент для колонки
const Column = forwardRef(({ block, children, mode, className, dropRef, isOver }, ref) => {
  const isEditMode = mode === 'edit';
  const hasChildren = React.Children.count(children) > 0;
  const finalClasses = [
    styles.column,
    className,
    isEditMode && !hasChildren ? styles.isEmpty : '',
    isOver ? styles.isOverInner : '',
  ].filter(Boolean).join(' ');

  return (
    <div ref={ref} className={finalClasses} style={block.styles}>
      {hasChildren ? children : (
        isEditMode && <div ref={dropRef} className={`${styles.emptyDropZone} ${isOver ? styles.isOver : ''}`}>Перетащите блок сюда</div>
      )}
    </div>
  );
});


const ColumnsBlock = forwardRef(({ block, children, mode, className, ...restProps }, ref) => {
  const { variants = {}, styles: blockStyles = {} } = block;
  const inlineStyles = {
    gap: variants.gap || '1rem',
    alignItems: variants.verticalAlign || 'flex-start',
    ...blockStyles,
  };

  return (
    <motion.div ref={ref} className={`${styles.columnsWrapper} ${className}`} style={inlineStyles} {...restProps}>
      {children}
    </motion.div>
  );
});

ColumnsBlock.blockInfo = {
  type: 'custom/columns',
  label: 'Колонки',
  icon: <Columns3Icon />,

  // При создании блока сразу генерируем дочерние колонки
  defaultData: {
    type: 'custom/columns',
    variants: {
      columns: 2,
      gap: '1rem',
      verticalAlign: 'flex-start',
    },
    styles: {},
    children: [
      { id: nanoid(), type: 'core/container', children: [], props: {}, styles: { flex: 1 } },
      { id: nanoid(), type: 'core/container', children: [], props: {}, styles: { flex: 1 } },
    ],
  },
  
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

  getToolbarItems: ({ block, actions }) => {
    const { variants = {} } = block;
    const updateColumns = (count) => {
      const newChildren = Array.from({ length: count }, () => ({
        id: nanoid(),
        type: 'core/container',
        children: [],
        props: {},
        styles: { flex: 1 },
      }));
      actions.update(block.id, {
        variants: { ...variants, columns: count },
        children: newChildren,
      });
    };

    return (
      <div className="toolbarButtonGroup">
        <ToolbarButton title="2 колонки" isActive={variants.columns === 2} onClick={() => updateColumns(2)}><Columns2Icon /></ToolbarButton>
        <ToolbarButton title="3 колонки" isActive={variants.columns === 3} onClick={() => updateColumns(3)}><Columns3Icon /></ToolbarButton>
        <ToolbarButton title="4 колонки" isActive={variants.columns === 4} onClick={() => updateColumns(4)}><Columns4Icon /></ToolbarButton>
      </div>
    );
  },

  getEditor: ({ block, onChange }, helpers) => {
    const { variants = {} } = block;
    const updateVariant = (name, value) => helpers.updateVariant(name, value);
    
    const handleColumnCountChange = (count) => {
        const newChildren = Array.from({ length: count }, () => ({
            id: nanoid(),
            type: 'core/container',
            children: [],
            props: {},
            styles: { flex: 1 },
        }));
        onChange({
            variants: { ...variants, columns: count },
            children: newChildren,
        });
    };

    return (
      <Tabs>
        <Tab title="Компоновка">
          <h4>Количество колонок</h4>
          <Select
            value={variants.columns || 2}
            options={[ {value: 2, label: '2'}, {value: 3, label: '3'}, {value: 4, label: '4'} ]}
            onChange={handleColumnCountChange}
          />
          <hr/>
          <h4>Отступы</h4>
          <CustomUnitInput
            label="Между колонками"
            value={variants.gap || '1rem'}
            onChange={(val) => updateVariant('gap', val)}
          />
          <hr/>
          <h4>Выравнивание</h4>
          <PresetSelector
            label="Вертикальное выравнивание"
            options={ColumnsBlock.blockInfo.supportedVariants.verticalAlign.options}
            value={variants.verticalAlign || 'flex-start'}
            onChange={(val) => updateVariant('verticalAlign', val)}
          />
        </Tab>
      </Tabs>
    );
  },
};

export default withBlockFeatures(ColumnsBlock, styles);