import React, { forwardRef } from 'react';
import styles from './ButtonBlock.module.css';
import Tabs from '../../ui/Tabs';
import Tab from '../../ui/Tab';
import Input from '../../ui/Input';
import Select from '../../ui/Select';
import Checkbox from '../../ui/Checkbox';
import { ButtonIcon } from '../../utils/icons';

const ButtonBlock = forwardRef(
  ({ block, mode, onClick, variantClassKeys = [], ...restProps }, ref) => {
    const { props = {}, styles: inlineStyles = {} } = block;
    const { content, href, target } = props;
    const isEditMode = mode === 'edit';

    const finalClasses = [
      styles.button,
      ...variantClassKeys.map(key => styles[key])
    ].filter(Boolean).join(' ');

    const commonProps = {
      className: finalClasses,
      style: inlineStyles,
      ...restProps,
      onClick,
    };

    if (!isEditMode && href) {
      return <a ref={ref} href={href} target={target} rel={target === '_blank' ? 'noopener noreferrer' : null} {...commonProps}>{content}</a>;
    }

    return <div ref={ref} {...commonProps}>{content}</div>;
  }
);

ButtonBlock.blockInfo = {
  type: 'core/button',
  label: 'Кнопка',
  icon: <ButtonIcon />,

  defaultData: {
    type: 'core/button',
    props: { content: 'Нажми меня', href: '#', target: '' },
    variants: { style: 'primary', size: 'medium', width: 'auto' },
    styles: {},
  },

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

  getToolbarItems: () => [],

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

export default ButtonBlock;