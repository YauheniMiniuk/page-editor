import React from 'react';
import styles from './ImageBlock.module.css';

// UI-компоненты
import Tabs from '../../ui/Tabs';
import Tab from '../../ui/Tab';
import Input from '../../ui/Input';
import Select from '../../ui/Select';
import Checkbox from '../../ui/Checkbox';

const ImageBlock = ({ block }) => {
  const { props, styles: blockStyles } = block;
  const { src, alt, href, target } = props || {};

  const imageElement = (
    <img
      src={src || 'https://placehold.co/600x400/f0f2f5/a0a0a0?text=Загрузите+изображение'}
      alt={alt}
      className={styles.image}
      onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/600x400/fbeeee/c72626?text=Ошибка!'; }}
    />
  );

  const finalElement = href ? (
    <a href={href} target={target} rel={target === '_blank' ? 'noopener noreferrer' : null} className={styles.linkWrapper}>
      {imageElement}
    </a>
  ) : imageElement;

  return (
    <div className={styles.imageWrapper} style={blockStyles}>
      {finalElement}
    </div>
  );
};

// --- Статическая информация ---
ImageBlock.blockInfo = {
  type: 'IMAGE',
  label: 'Изображение',
  defaultData: {
    type: 'IMAGE',
    props: {
      src: '',
      alt: 'Описание изображения',
      href: '',
      target: '',
    },
    styles: {
      width: '100%',
      objectFit: 'cover',
      height: '300px',
    },
  },
};

// --- Панель свойств ---
ImageBlock.getEditor = ({ block, onChange }) => {
  const { props = {}, styles = {} } = block;
  const handlePropsChange = (newProps) => onChange({ props: { ...props, ...newProps } });
  const handleStyleChange = (newStyles) => onChange({ styles: { ...styles, ...newStyles } });

  return (
    <Tabs>
      <Tab title="Контент">
        <h4>Источник</h4>
        <Input label="URL изображения" value={props.src || ''} placeholder="https://..." onChange={(e) => handlePropsChange({ src: e.target.value })} />
        <Input label="Альтернативный текст (alt)" value={props.alt || ''} placeholder="Для SEO и доступности" onChange={(e) => handlePropsChange({ alt: e.target.value })} />
        <hr />
        <h4>Ссылка</h4>
        <Input label="URL ссылки" value={props.href || ''} placeholder="https://..." onChange={(e) => handlePropsChange({ href: e.target.value })} />
        <Checkbox label="Открывать в новой вкладке" checked={props.target === '_blank'} onChange={(e) => handlePropsChange({ target: e.target.checked ? '_blank' : '' })} />
      </Tab>
      <Tab title="Стили">
        <h4>Размеры и вид</h4>
        <Input label="Высота (height)" placeholder="auto или 300px" value={styles.height || ''} onChange={(e) => handleStyleChange({ height: e.target.value })} />
        <Select label="Вписывание (object-fit)" value={styles.objectFit || 'cover'}
          options={[ { label: 'Заполнить (cover)', value: 'cover' }, { label: 'Вместить (contain)', value: 'contain' }, { label: 'Растянуть (fill)', value: 'fill' } ]}
          onChange={(val) => handleStyleChange({ objectFit: val })} />
        <Input label="Скругление углов (px)" type="number" value={parseInt(styles.borderRadius) || 0} onChange={(e) => handleStyleChange({ borderRadius: `${e.target.value}px` })} />
      </Tab>
    </Tabs>
  );
};

export default ImageBlock;
