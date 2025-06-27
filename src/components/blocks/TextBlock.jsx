import React, { useRef, useEffect } from 'react';
import styles from './TextBlock.module.css';

// UI-компоненты
import Tabs from '../../ui/Tabs';
import Tab from '../../ui/Tab';
import Input from '../../ui/Input';
import ColorPicker from '../../ui/ColorPicker';
import Select from '../../ui/Select';

/**
 * Компонент для отображения и редактирования текстового блока.
 * @param {object} props - Пропсы
 * @param {object} props.block - Объект данных блока
 * @param {string} props.mode - Режим редактора ('edit' или 'view')
 * @param {object} props.actions - Глобальные действия из useBlockManager
 */
const TextBlock = ({ block, mode, actions }) => {
  const { props = {}, content, styles: blockStyles = {} } = block;
  const isEditMode = mode === 'edit';
  const textRef = useRef(null);

  // Используем HTML-тег из пропсов, по умолчанию <p>
  const Tag = props.as || 'p';

  // Синхронизируем внутренний текст элемента с состоянием
  useEffect(() => {
    if (textRef.current && textRef.current.innerHTML !== content) {
      textRef.current.innerHTML = content || '';
    }
  }, [content]);

  // Обработчик для прямого редактирования текста
  const handleInput = (e) => {
    // FIX: Используем actions, переданный через пропсы, и явно указываем ID
    if (actions?.update) {
      actions.update(block.id, { content: e.currentTarget.innerHTML });
    }
  };

  return (
    <Tag
      ref={textRef}
      className={styles.textBlock}
      style={blockStyles}
      contentEditable={isEditMode}
      suppressContentEditableWarning={true}
      onInput={handleInput}
      data-placeholder={isEditMode && !content ? 'Введите текст...' : ''}
    />
  );
};

// --- Статическая информация о блоке ---
TextBlock.blockInfo = {
  type: 'TEXT', // Простая строка
  label: 'Текст',
  defaultData: {
    type: 'TEXT',
    content: 'Это новый текстовый блок. Кликните, чтобы редактировать.',
    props: { as: 'p' },
    styles: {
      fontSize: '16px',
      color: '#333333',
      lineHeight: 1.6,
      margin: '0',
    },
  },
};

// --- Панель свойств ---
// `getEditor` по-прежнему получает `onChange` из PropertiesPanel, это правильный паттерн
TextBlock.getEditor = ({ block, onChange }) => {
  const { props = {}, styles = {} } = block;
  const handlePropsChange = (newProps) => onChange({ props: { ...props, ...newProps } });
  const handleStyleChange = (newStyles) => onChange({ styles: { ...styles, ...newStyles } });

  return (
    <Tabs>
      <Tab title="Стили">
        <h4>Типографика</h4>
        <ColorPicker label="Цвет текста" value={styles.color || '#333333'} onChange={(val) => handleStyleChange({ color: val })}/>
        <Input label="Размер шрифта (px)" type="number" value={parseInt(styles.fontSize) || 16} onChange={(e) => handleStyleChange({ fontSize: `${e.target.value}px` })}/>
        <Select label="Выравнивание" value={styles.textAlign || 'left'}
          options={[ { label: 'По левому краю', value: 'left' }, { label: 'По центру', value: 'center' }, { label: 'По правому краю', value: 'right' } ]}
          onChange={(val) => handleStyleChange({ textAlign: val })} />
      </Tab>
      <Tab title="Настройки">
        <h4>HTML-тег</h4>
        <Select label="Семантический тег" value={props.as || 'p'}
          options={[ { label: 'Параграф (p)', value: 'p' }, { label: 'Блок (div)', value: 'div' } ]}
          onChange={(val) => handlePropsChange({ as: val })} />
      </Tab>
    </Tabs>
  );
};

// --- Тулбар ---
TextBlock.getToolbarItems = ({ block, actions }) => {
    const currentStyles = block.styles || {};
    // FIX: Все вызовы используют actions.update с явным указанием ID
    return [
      <div key="text-align-group" className="toolbarButtonGroup">
        <button title="Выровнять по левому краю" onClick={() => actions.update(block.id, { styles: { ...currentStyles, textAlign: 'left' } })} className={!currentStyles.textAlign || currentStyles.textAlign === 'left' ? 'active' : ''}>L</button>
        <button title="Выровнять по центру" onClick={() => actions.update(block.id, { styles: { ...currentStyles, textAlign: 'center' } })} className={currentStyles.textAlign === 'center' ? 'active' : ''}>C</button>
        <button title="Выровнять по правому краю" onClick={() => actions.update(block.id, { styles: { ...currentStyles, textAlign: 'right' } })} className={currentStyles.textAlign === 'right' ? 'active' : ''}>R</button>
      </div>
    ];
};

export default TextBlock;
