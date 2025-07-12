import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import classNames from 'classnames';

import styles from './IconBlock.module.css';
import { withBlock } from '../../hocs/withBlock';

// --- UI ---
import Icon, { availableIcons } from '../../ui/Icon'; // Наш новый компонент
import Tabs from '../../ui/Tabs';
import Tab from '../../ui/Tab';
import Input from '../../ui/Input';
import Checkbox from '../../ui/Checkbox';
import ColorPicker from '../../ui/ColorPicker';
import CustomUnitInput from '../../ui/CustomUnitInput';
import { HelpIcon } from '../../utils/icons'; // Иконка по умолчанию

//================================================================================
// 1. Компонент блока "Иконка"
//================================================================================
const IconBlock = forwardRef(({ block, mode, className, style, ...rest }, ref) => {
    const { props = {}, styles: inlineStyles = {} } = block;
    const isEditMode = mode === 'edit';

    const finalStyles = {
        ...inlineStyles,
        ...style,
        fontSize: props.size || '48px', // Управляем размером через fontSize
        color: props.color || 'currentColor', // Управляем цветом через color
    };

    const iconTag = <Icon name={props.iconName || 'HelpIcon'} />;

    // Плейсхолдер, если иконка не выбрана
    if (!props.iconName && isEditMode) {
        return (
            <div ref={ref} className={classNames(styles.placeholder, className)} style={style} {...rest}>
                <HelpIcon />
                <span>Выберите иконку</span>
            </div>
        );
    }

    // Оборачиваем в ссылку в режиме просмотра
    if (!isEditMode && props.href) {
        return (
            <a
                ref={ref}
                href={props.href}
                target={props.target}
                rel={props.target === '_blank' ? 'noopener noreferrer' : null}
                className={classNames(styles.wrapper, styles.link, className)}
                style={finalStyles}
                {...rest}
            >
                {iconTag}
            </a>
        );
    }

    return (
        <motion.div ref={ref} className={classNames(styles.wrapper, className)} style={finalStyles} {...rest}>
            {iconTag}
        </motion.div>
    );
});

IconBlock.blockStyles = styles;

//================================================================================
// 2. "Паспорт" блока
//================================================================================
IconBlock.blockInfo = {
    type: 'core/icon',
    label: 'Иконка',
    icon: <HelpIcon />, // Используем иконку-заглушку
    isContainer: false,
    description: 'Вставляет векторную иконку из библиотеки с настройками.',
    keywords: ['иконка', 'значок', 'svg', 'icon'],

    supports: { reusable: true, html: false },

    defaultData: () => ({
        type: 'core/icon',
        props: {
            iconName: 'HelpIcon',
            size: '48px',
            color: '#333333',
            href: '',
            target: '',
        },
        styles: {},
        variants: {},
    }),

    getToolbarItems: () => null,

    getEditor: ({ block, onChange }) => {
        const { props = {} } = block;
        const handlePropsChange = (newProps) => onChange({ props: { ...props, ...newProps } });

        return (
            <Tabs>
                <Tab title="Иконка">
                    <h4>Выберите иконку</h4>
                    <div className={styles.iconGrid}>
                        {availableIcons.map(({ name, Component }) => (
                            <button
                                key={name}
                                title={name}
                                className={classNames(styles.iconButton, { [styles.isActive]: props.iconName === name })}
                                onClick={() => handlePropsChange({ iconName: name })}
                            >
                                <Component />
                            </button>
                        ))}
                    </div>
                </Tab>
                <Tab title="Стили">
                    <CustomUnitInput
                        label="Размер"
                        value={props.size || '48px'}
                        onChange={(val) => handlePropsChange({ size: val })}
                        units={['px', 'em', 'rem']}
                    />
                    <ColorPicker
                        label="Цвет"
                        value={props.color || ''}
                        onChange={(color) => handlePropsChange({ color })}
                    />
                </Tab>
                <Tab title="Ссылка">
                    <Input label="URL ссылки" placeholder="https://..." value={props.href || ''} onChange={(e) => handlePropsChange({ href: e.target.value })} />
                    <Checkbox label="Открывать в новой вкладке" checked={props.target === '_blank'} onChange={(e) => handlePropsChange({ target: e.target.checked ? '_blank' : '' })} />
                </Tab>
            </Tabs>
        );
    }
};

export default withBlock(IconBlock);