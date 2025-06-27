import React from 'react';
import styles from './ButtonBlock.module.css';

// UI-компоненты
import Tabs from '../../ui/Tabs';
import Tab from '../../ui/Tab';
import Input from '../../ui/Input';
import ColorPicker from '../../ui/ColorPicker';
import Select from '../../ui/Select';
import Checkbox from '../../ui/Checkbox';

const ButtonBlock = ({ block, mode }, ref) => {
  const { props = {}, styles: blockStyles = {} } = block;
  const { content, href, target } = props;
  const isEditMode = mode === 'edit';

  const commonProps = {
    className: styles.button,
    style: blockStyles,
  };

  if (!isEditMode && href) {
    return (
      <a ref={ref} href={href} target={target} rel={target === '_blank' ? 'noopener noreferrer' : null} {...commonProps}>
        {content}
      </a>
    );
  }

  return (
    <div ref={ref} {...commonProps}>
      {content}
    </div>
  );
};

// --- Статическая информация ---
ButtonBlock.blockInfo = {
  type: 'BUTTON',
  label: 'Кнопка',
  defaultData: {
    type: 'BUTTON',
    props: {
      content: 'Нажми меня',
      href: '#',
      target: '',
    },
    styles: {
      display: 'inline-block',
      backgroundColor: '#007bff',
      color: '#ffffff',
      padding: '12px 24px',
      borderRadius: '8px',
      textAlign: 'center',
      fontWeight: 'bold',
      textDecoration: 'none',
      border: 'none',
    },
  },
};

// --- Панель свойств ---
ButtonBlock.getEditor = ({ block, onChange }) => {
  const { props = {}, styles = {} } = block;
  const handlePropsChange = (newProps) => onChange({ props: { ...props, ...newProps } });
  const handleStyleChange = (newStyles) => onChange({ styles: { ...styles, ...newStyles } });

  return (
    <Tabs>
      <Tab title="Контент">
        <Input label="Текст кнопки" value={props.content || ''} onChange={(e) => handlePropsChange({ content: e.target.value })} />
        <hr />
        <h4>Ссылка</h4>
        <Input label="URL-адрес" placeholder="https://..." value={props.href || ''} onChange={(e) => handlePropsChange({ href: e.target.value })} />
        <Checkbox label="Открывать в новой вкладке" checked={props.target === '_blank'} onChange={(e) => handlePropsChange({ target: e.target.checked ? '_blank' : '' })} />
      </Tab>
      <Tab title="Стили">
        <h4>Вид</h4>
        <ColorPicker label="Цвет фона" value={styles.backgroundColor || '#007bff'} onChange={(val) => handleStyleChange({ backgroundColor: val })} />
        <ColorPicker label="Цвет текста" value={styles.color || '#ffffff'} onChange={(val) => handleStyleChange({ color: val })} />
      </Tab>
    </Tabs>
  );
};

export default ButtonBlock;
