import React from 'react';
import styles from './SpacerBlock.module.css';

// UI-компоненты
import Tabs from '../../ui/Tabs';
import Tab from '../../ui/Tab';
import Input from '../../ui/Input';
import ColorPicker from '../../ui/ColorPicker';
import Checkbox from '../../ui/Checkbox';

const SpacerBlock = ({ block }) => {
  const { props = {}, styles: blockStyles = {} } = block;
  const { showLine = false } = props;

  if (showLine) {
    const lineStyles = {
      borderTopWidth: blockStyles.height || '1px',
      borderTopColor: blockStyles.color || '#e0e0e0',
    };
    return <hr className={styles.divider} style={lineStyles} />;
  }

  return <div style={{ height: blockStyles.height || '20px' }} />;
};

// --- Статическая информация ---
SpacerBlock.blockInfo = {
  type: 'SPACER',
  label: 'Отступ',
  defaultData: {
    type: 'SPACER',
    props: { showLine: false },
    styles: { height: '30px' },
  },
};

// --- Панель свойств ---
SpacerBlock.getEditor = ({ block, onChange }) => {
  const { props = {}, styles = {} } = block;
  const isLine = props.showLine || false;

  const handlePropsChange = (newProps) => onChange({ props: { ...props, ...newProps } });
  const handleStyleChange = (newStyles) => onChange({ styles: { ...styles, ...newStyles } });
  
  return (
    <Tabs>
      <Tab title="Настройки">
        <Checkbox label="Показывать линию-разделитель" checked={isLine} onChange={(e) => handlePropsChange({ showLine: e.target.checked })} />
        <hr/>
        <Input
          label={isLine ? "Толщина линии (px)" : "Высота отступа (px)"}
          type="number"
          value={parseInt(styles.height) || (isLine ? 1 : 30)}
          onChange={(e) => handleStyleChange({ height: `${e.target.value}px` })}
        />
        {isLine && (
          <ColorPicker label="Цвет линии" value={styles.color || '#e0e0e0'} onChange={(val) => handleStyleChange({ color: val })} />
        )}
      </Tab>
    </Tabs>
  );
};

export default SpacerBlock;
