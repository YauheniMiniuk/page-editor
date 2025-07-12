import React, { forwardRef, useState } from 'react';
import styles from './ButtonBlock.module.css';
import Tabs from '../../ui/Tabs';
import Tab from '../../ui/Tab';
import Input from '../../ui/Input';
import Select from '../../ui/Select';
import Checkbox from '../../ui/Checkbox';
import { ButtonIcon } from '../../utils/icons';
import { withBlock } from '../../hocs/withBlock';
import classNames from 'classnames';
import { motion } from 'framer-motion';
import ToolbarButton from '../../ui/ToolbarButton';
import { LinkIcon } from 'lucide-react';

const ButtonBlock = forwardRef(({ block, mode, className, style, actions, ...rest }, ref) => {
  const { props = {}, styles: inlineStyles = {} } = block;
  const { content = 'Нажми меня', href, target } = props;
  const isEditMode = mode === 'edit';

  // Внутреннее состояние для редактирования текста нам больше не нужно,
  // так как мы будем использовать contentEditable напрямую.

  const finalClasses = classNames(styles.button, className);
  const finalStyles = { ...inlineStyles, ...style };

  const handleBlur = (e) => {
    // Обновляем контент, когда пользователь убирает фокус с кнопки
    if (isEditMode && actions) {
      const newContent = e.currentTarget.textContent;
      if (newContent !== content) {
        actions.update(block.id, { props: { ...props, content: newContent } });
      }
    }
  };

  // В режиме редактирования кнопка - это div с contentEditable
  if (isEditMode) {
    return (
      <div
        ref={ref}
        className={finalClasses}
        style={finalStyles}
        contentEditable // Включаем редактирование
        suppressContentEditableWarning={true}
        onBlur={handleBlur}
        {...rest} // <-- Здесь "живет" onClick, который выделит блок
      >
        {content}
      </div>
    );
  }

  // В режиме просмотра кнопка - это настоящая ссылка
  return (
    <a
      ref={ref}
      href={href || '#'}
      target={target}
      rel={target === '_blank' ? 'noopener noreferrer' : null}
      className={finalClasses}
      style={finalStyles}
    >
      {content}
    </a>
  );
});

ButtonBlock.blockStyles = styles;

//================================================================================
// 2. "Паспорт" блока
//================================================================================
ButtonBlock.blockInfo = {
  // --- Основная информация ---
  type: 'core/button',
  label: 'Кнопка',
  icon: <ButtonIcon />,
  isContainer: false,

  // --- Поиск и добавление ---
  description: 'Добавляет кликабельную кнопку-ссылку для навигации или призыва к действию.',
  keywords: ['ссылка', 'призыв к действию', 'cta', 'link'],

  // --- Правила ---
  parent: null,
  allowedBlocks: [],

  // --- Поддержка функций ---
  supports: {
    reusable: true,
    anchor: false, // У кнопок обычно нет якорей
    customClassName: true,
    html: false, // Текст кнопки - это plain text
  },

  // --- Трансформации ---
  transforms: {
    // Можно превратить простой текст в кнопку
    from: [{ type: 'block', block: 'core/text' }],
    to: [],
  },

  // --- Пример для превью ---
  example: {
    props: { content: 'Узнать больше', href: '#' },
    variants: { style: 'primary', size: 'medium', width: 'auto' },
  },

  // --- Данные по умолчанию ---
  defaultData: () => ({
    type: 'core/button',
    props: { content: 'Нажми меня', href: '#', target: '' },
    variants: { style: 'primary', size: 'medium', width: 'auto' },
    styles: {},
  }),

  supportedVariants: {
    style: {
      label: 'Стиль',
      options: [
        { value: 'primary', label: 'Основной' },
        { value: 'outline', label: 'Контурный' },
      ],
      defaultValue: 'primary',
    },
    size: {
      label: 'Размер',
      options: [
        { value: 'small', label: 'S' },
        { value: 'medium', label: 'M' },
        { value: 'large', label: 'L' },
      ],
      defaultValue: 'medium',
    },
    width: {
      label: 'Ширина',
      options: [
        { value: 'auto', label: 'Авто' },
        { value: 'full', label: 'Во всю ширину' },
      ],
      defaultValue: 'auto',
    }
  },

  getToolbarItems: ({ block, actions }) => {
    // Просто для примера, как можно будет добавить тулбар
    const openLinkModal = () => {
      const url = prompt("Введите URL:", block.props.href || "https://");
      if (url !== null) {
        actions.update(block.id, { props: { ...block.props, href: url } });
      }
    };
    return (
      <ToolbarButton title="Изменить ссылку" onClick={openLinkModal}>
        <LinkIcon />
      </ToolbarButton>
    );
  },

  getEditor: ({ block, onChange }, helpers) => {
    const { props = {} } = block;
    const handlePropsChange = (newProps) => onChange({ props: { ...props, ...newProps } });

    return (
      <Tabs>
        <Tab title="Настройки">
          <h4>Стиль кнопки</h4>
          <Select
            label="Пресет"
            options={ButtonBlock.blockInfo.supportedVariants.style.options}
            {...helpers.getVariantSelectProps('style')}
          />
          <Select
            label="Размер"
            options={ButtonBlock.blockInfo.supportedVariants.size.options}
            {...helpers.getVariantSelectProps('size')}
          />
          <Select
            label="Ширина"
            options={ButtonBlock.blockInfo.supportedVariants.width.options}
            {...helpers.getVariantSelectProps('width')}
          />
        </Tab>
        <Tab title="Контент">
          <Input label="Текст кнопки" value={props.content || ''} onChange={(e) => handlePropsChange({ content: e.target.value })} />
          <hr />
          <h4>Ссылка</h4>
          <Input label="URL-адрес" placeholder="https://..." value={props.href || ''} onChange={(e) => handlePropsChange({ href: e.target.value })} />
          <Checkbox label="Открывать в новой вкладке" checked={props.target === '_blank'} onChange={(e) => handlePropsChange({ target: e.target.checked ? '_blank' : '' })} />
        </Tab>
      </Tabs>
    );
  },
};

export default withBlock(ButtonBlock);