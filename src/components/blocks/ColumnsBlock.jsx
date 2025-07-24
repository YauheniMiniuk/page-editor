import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { nanoid } from 'nanoid';
import classNames from 'classnames';
import styles from './ColumnsBlock.module.css';

// HOC и UI
import { withBlock } from '../../hocs/withBlock';
import { Columns2Icon, Columns3Icon, Columns4Icon, ColumnsIcon } from '../../utils/icons';
import Tabs from '../../ui/Tabs';
import Tab from '../../ui/Tab';
import Select from '../../ui/Select';
import PresetSelector from '../../ui/PresetSelector';
import Checkbox from '../../ui/Checkbox';
import CustomUnitInput from '../../ui/CustomUnitInput';
import { defaultData as columnDefaultData } from './ColumnBlock';
import ColumnBlock from './ColumnBlock';
import ToolbarButton from '../../ui/ToolbarButton';
import Input from '../../ui/Input';

// --- Компонент ---
const ColumnsBlock = forwardRef(({ block, children, className, style, ...rest }, ref) => {
  const { variants = {}, styles: blockStyles = {} } = block;

  const finalStyles = { ...blockStyles, ...style, gap: variants.gap };
  const finalClasses = classNames(
    styles.columnsWrapper,
    className,
    {
      [styles[`variant-align-${variants.align}`]]: variants.align,
      [styles[`variant-direction-${variants.direction}`]]: variants.direction,
      [styles[`variant-justifyContent-${variants.justifyContent}`]]: variants.justifyContent,
      [styles[`variant-verticalAlign-${variants.verticalAlign}`]]: variants.verticalAlign,
      [styles['variant-stackOnMobile-true']]: variants.stackOnMobile,
    }
  );

  return (
    <motion.div ref={ref} className={finalClasses} style={finalStyles} {...rest}>
      {children}
    </motion.div>
  );
});

ColumnsBlock.blockStyles = styles;

// --- Конфигурация ---
ColumnsBlock.blockInfo = {
  type: 'core/columns',
  label: 'Колонки',
  icon: <ColumnsIcon />,
  isContainer: true,
  layoutDirection: 'row',
  allowedBlocks: ['core/column'],
  supports: { reusable: true, anchor: true, customClassName: true, },

  defaultData: () => ({
    type: 'core/columns',
    variants: {
      columns: 2,
      gap: '0px',
      verticalAlign: 'flex-start',
      stackOnMobile: true,
    },
    styles: {},
    children: [
      { ...columnDefaultData(), id: nanoid() },
      { ...columnDefaultData(), id: nanoid() },
    ],
  }),

  getEditor: ({ block, onChange }) => {
    const { props = {}, styles = {}, variants = {} } = block;

    // --- ОБРАБОТЧИКИ ---

    const handleStyleChange = (newStyles) => {
      onChange({ styles: { ...styles, ...newStyles } });
    };

    const handleVariantChange = (name, value) => {
      onChange({ variants: { ...variants, [name]: value } });
    };

    const handleTemplateChange = (template) => {
      const { widths, name } = template;
      const newColumnCount = widths.length;

      const newChildren = Array.from({ length: newColumnCount }, (_, index) => {
        const existingChild = block.children[index] || { ...ColumnBlock.blockInfo.defaultData(), id: nanoid() };

        // Управляем шириной только через flex, разрешая сжатие (второй параметр `1`)
        // `flex: <grow> <shrink> <basis>`
        const flexValue = widths[index] === '1fr'
          ? '1 1 0%' // Для гибких колонок (растут и сжимаются)
          : `0 1 ${widths[index]}`; // Для колонок с % (не растут, но могут сжиматься)

        return {
          ...existingChild,
          styles: { ...existingChild.styles, flex: flexValue, width: undefined },
        };
      });

      // Обновляем И дочерние элементы, И количество, И НАЗВАНИЕ шаблона
      onChange({
        children: newChildren,
        variants: { ...variants, columns: newColumnCount, template: name },
      });
    };

    const handleColumnCountChange = (newCount) => {
      const currentChildren = block.children || [];
      const currentCount = currentChildren.length;
      let newChildren = [...currentChildren];

      if (newCount > currentCount) {
        for (let i = 0; i < newCount - currentCount; i++) {
          newChildren.push({ ...ColumnBlock.blockInfo.defaultData(), id: nanoid() });
        }
      } else if (newCount < currentCount) {
        newChildren = newChildren.slice(0, newCount);
      }

      // Сбрасываем стили, чтобы колонки стали равными и гибкими
      newChildren = newChildren.map(child => ({
        ...child,
        styles: { ...child.styles, width: undefined, flex: '1 1 0%' }
      }));

      onChange({
        variants: { ...variants, columns: newCount, template: undefined }, // Сбрасываем шаблон
        children: newChildren,
      });
    };

    // Определяем опции для шаблонов с уникальными именами
    const templateOptions = [
      { name: '50/50', label: '50% / 50%', widths: ['1fr', '1fr'] },
      { name: '30/70', label: '30% / 70%', widths: ['30%', '70%'] },
      { name: '70/30', label: '70% / 30%', widths: ['70%', '30%'] },
      { name: '33/33/33', label: '33% x 3', widths: ['1fr', '1fr', '1fr'] },
      { name: '25x4', label: '25% x 4', widths: ['1fr', '1fr', '1fr', '1fr'] },
    ];

    return (
      <Tabs>
        <Tab title="Компоновка">
          <h4>Шаблоны</h4>
          <PresetSelector
            label="Выберите раскладку"
            // Передаем опции с уникальными именами
            options={templateOptions.map(t => ({ value: t.name, label: t.label }))}
            // Сравниваем по имени шаблона
            value={variants.template}
            // В обработчик передаем весь объект шаблона
            onChange={(templateName) => {
              const selectedTemplate = templateOptions.find(t => t.name === templateName);
              if (selectedTemplate) {
                handleTemplateChange(selectedTemplate);
              }
            }}
          />
          <hr />
          <h4>Колонки</h4>
          <Select
            label="Количество"
            value={variants.columns || 2}
            options={[{ value: 2, label: '2' }, { value: 3, label: '3' }, { value: 4, label: '4' }]}
            onChange={(val) => handleColumnCountChange(Number(val))}
          />
          <CustomUnitInput
            label="Промежуток (gap)"
            value={variants.gap || ''}
            onChange={(val) => handleVariantChange('gap', val)}
          />
          <hr />
          <h4>Выравнивание</h4>
          <Select
            label="Вертикальное"
            options={[
              { value: 'flex-start', label: 'По верху' },
              { value: 'center', label: 'По центру' },
              { value: 'flex-end', label: 'По низу' },
              { value: 'stretch', label: 'Растянуть по высоте' },
            ]}
            value={variants.verticalAlign || 'flex-start'}
            onChange={(val) => handleVariantChange('verticalAlign', val)}
          />
          <hr />
          <h4>Адаптивность</h4>
          <Checkbox
            label="Складывать в столбик на мобильных"
            checked={variants.stackOnMobile !== false}
            onChange={(e) => handleVariantChange('stackOnMobile', e.target.checked)}
          />
        </Tab>
        <Tab title="Стили">
          <h4>Отступы</h4>
          <CustomUnitInput
            label="Внешние (margin)"
            value={styles.margin || ''}
            onChange={(val) => handleStyleChange({ margin: val })}
          />
          <CustomUnitInput
            label="Внутренние (padding)"
            value={styles.padding || ''}
            onChange={(val) => handleStyleChange({ padding: val })}
          />
        </Tab>
        <Tab title="Дополнительно">
          <Input
            label="HTML-якорь (ID)"
            value={props.id || ''}
            onChange={(e) => onChange({ props: { ...props, id: e.target.value } })}
            helpText="Позволяет создать прямую ссылку на этот блок."
          />
        </Tab>
      </Tabs>
    );
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
};

export default withBlock(ColumnsBlock);