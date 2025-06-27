import React from 'react';
import styles from './ContainerBlock.module.css';
// Импортируем наши UI-компоненты
import Tabs from '../../ui/Tabs';
import Tab from '../../ui/Tab';
import Input from '../../ui/Input';
import Select from '../../ui/Select';
import ColorPicker from '../../ui/ColorPicker';

const ContainerBlock = ({ block, children, mode, isOver, dropRef }, ref) => {
  const { props = {}, styles: blockStyles = {} } = block;
  const Tag = props.as || 'div';
  const isEditMode = mode === 'edit';
  const hasChildren = React.Children.count(children) > 0;

  const setRefs = (node) => {
    if (typeof ref === 'function') ref(node);
    else if (ref) ref.current = node;

    if (typeof dropRef === 'function') dropRef(node);
    else if (dropRef) dropRef.current = node;
  };

  const containerClasses = [
    styles.container,
    isEditMode && !hasChildren ? styles.isEmpty : '',
    isEditMode && isOver ? styles.isOver : '',
  ].filter(Boolean).join(' ');

  const { flexDirection, ...restBlockStyles } = blockStyles;

  const containerStyles = {
    display: 'flex',
    flexDirection: props.direction || 'column',
    ...restBlockStyles,
  };

  return (
    <Tag ref={setRefs} className={containerClasses} style={containerStyles}>
      {children}
      {isEditMode && !hasChildren && (
        <div className={styles.emptyPlaceholder}>
          Перетащите блок сюда
        </div>
      )}
    </Tag>
  );
};

ContainerBlock.blockInfo = {
  type: 'CONTAINER',
  label: 'Контейнер',
  defaultData: {
    type: 'CONTAINER',
    children: [],
    props: { as: 'section' },
    styles: {
      display: 'flex',
      flexDirection: 'row',
      padding: '10px',
      gap: '16px',
    },
  },
};

// --- Тулбар с быстрыми настройками ---
ContainerBlock.getToolbarItems = ({ block, actions }, ref) => {
  const currentDirection = block.props?.direction || 'column';
  const nextDirection = currentDirection === 'column' ? 'row' : 'column';
  const currentAlign = block.align || 'none';

  return [
    <div key="align-group" className="toolbarButtonGroup">
      <button title="Ширина контента" onClick={() => actions.update(block.id, { align: 'none' })} className={currentAlign === 'none' ? 'active' : ''}>C</button>
      <button title="Широкая ширина" onClick={() => actions.update(block.id, { align: 'wide' })} className={currentAlign === 'wide' ? 'active' : ''}>W</button>
      <button title="Во всю ширину" onClick={() => actions.update(block.id, { align: 'full' })} className={currentAlign === 'full' ? 'active' : ''}>F</button>
    </div>,
    <div key="separator" className="toolbarSeparator"></div>,
    <button
      key="direction"
      onClick={() => actions.update(block.id, { props: { ...block.props, direction: nextDirection } })}
      title={`Направление: ${nextDirection}`}
    >
      {currentDirection === 'column' ? '⬇' : '➡'}
    </button>
  ];
};

// --- Боковая панель с детальными настройками ---
ContainerBlock.getEditor = ({ block, onChange }) => {
  const { props: currentProps = {}, styles: currentStyles = {} } = block;

  const handleStyleChange = (newStyles) => {
    onChange({ styles: { ...currentStyles, ...newStyles } });
  };

  const handlePropsChange = (newProps) => {
    onChange({ props: { ...currentProps, ...newProps } });
  };

  return (
    <Tabs>
      <Tab title="Стили">
        <h4>Цвет</h4>
        <ColorPicker
          label="Фон"
          value={currentStyles.backgroundColor || ''}
          onChange={(val) => handleStyleChange({ backgroundColor: val })}
        />
        <ColorPicker
          label="Текст"
          value={currentStyles.color || ''}
          onChange={(val) => handleStyleChange({ color: val })}
        />

        <hr />
        <h4>Размеры</h4>
        <Input
          label="Внутренний отступ (padding)"
          placeholder="15px или 10px 20px"
          value={currentStyles.padding || ''}
          onChange={(e) => handleStyleChange({ padding: e.target.value })}
        />
        <Input
          label="Внешний отступ (margin)"
          placeholder="0 auto"
          value={currentStyles.margin || ''}
          onChange={(e) => handleStyleChange({ margin: e.target.value })}
        />
      </Tab>

      <Tab title="Настройки">
        <h4>Компоновка (Flexbox)</h4>
        <Select
          label="Горизонтальное выравнивание (justify-content)"
          value={currentStyles.justifyContent || 'flex-start'}
          options={[
            { label: 'Начало', value: 'flex-start' }, { label: 'Центр', value: 'center' },
            { label: 'Конец', value: 'flex-end' }, { label: 'Между', value: 'space-between' },
            { label: 'Вокруг', value: 'space-around' },
          ]}
          onChange={(val) => handleStyleChange({ justifyContent: val })}
        />
        <Select
          label="Вертикальное выравнивание (align-items)"
          value={currentStyles.alignItems || 'stretch'}
          options={[
            { label: 'Растянуть', value: 'stretch' }, { label: 'Начало', value: 'flex-start' },
            { label: 'Центр', value: 'center' }, { label: 'Конец', value: 'flex-end' },
          ]}
          onChange={(val) => handleStyleChange({ alignItems: val })}
        />
        <Input
          label="Промежуток (gap)"
          placeholder="10px"
          value={currentStyles.gap || ''}
          onChange={(e) => handleStyleChange({ gap: e.target.value })}
        />
        <label style={{ display: 'flex', alignItems: 'center', marginTop: '10px' }}>
          <input
            type="checkbox"
            checked={currentStyles.flexWrap === 'wrap'}
            onChange={(e) => handleStyleChange({ flexWrap: e.target.checked ? 'wrap' : 'nowrap' })}
          />
          <span style={{ marginLeft: '8px' }}>Переносить на несколько строк</span>
        </label>

        <hr />
        <h4>Дополнительно</h4>
        <Select
          label="HTML-тег"
          value={currentProps.as || 'div'}
          options={[
            { label: 'div (стандарт)', value: 'div' }, { label: 'section', value: 'section' },
            { label: 'header', value: 'header' }, { label: 'footer', value: 'footer' },
            { label: 'article', value: 'article' }, { label: 'aside', value: 'aside' },
            { label: 'main', value: 'main' },
          ]}
          onChange={(val) => handlePropsChange({ as: val })}
        />
        <Select
          label="Позиция"
          value={currentStyles.position || 'static'}
          options={[{ label: 'Статичная', value: 'static' }, { label: 'Липкая (sticky)', value: 'sticky' }]}
          onChange={(val) => handleStyleChange({ position: val })}
        />
      </Tab>
    </Tabs>
  );
};

export default ContainerBlock;