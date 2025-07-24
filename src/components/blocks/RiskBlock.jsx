import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import classNames from 'classnames';
import { ShieldAlert } from 'lucide-react';

import { withBlock } from '../../hocs/withBlock';
import styles from './RiskBlock.module.css';
import Tabs from '../../ui/Tabs';
import Tab from '../../ui/Tab';
import Input from '../../ui/Input';
import Select from '../../ui/Select';
import RangeControl from '../../ui/RangeControl';

//================================================================================
// 1. Конфигурация и внутренние компоненты
//================================================================================

// Выносим конфигурацию уровней риска в массив, чтобы не дублировать JSX
const RISK_LEVELS = [
    { level: 'high', label: 'Опасный', range: [7, 9] },
    { level: 'medium', label: 'Потенциально опасный', range: [4, 6] },
    { level: 'low', label: 'Низкий', range: [1, 3] },
    { level: 'none', label: 'Отсутствует', range: [-Infinity, 0] }
];

// Компонент для одной строки риска
const RiskRow = ({ level, label, range, value }) => {
    const isActive = value >= range[0] && value <= range[1];

    const rowClasses = classNames(
        styles.riskRow,
        styles[level], // .high, .medium, etc.
        { [styles.active]: isActive }
    );

    return (
        <div className={rowClasses}>
            <div className={styles.valueBox}>{value}</div>
            <div className={styles.labelBox}>{label}</div>
        </div>
    );
};

//================================================================================
// 2. Главный компонент блока
//================================================================================
const RiskBlock = forwardRef(({ block, className, style, ...rest }, ref) => {
    const { props } = block;

    const finalClasses = classNames(
        styles.wrapper,
        { [styles.darkTheme]: props.theme === 'dark' },
        className
    );

    return (
        <motion.div ref={ref} className={finalClasses} style={{ ...block.styles, ...style }} {...rest}>
            <h4 className={styles.title}>{props.title}</h4>
            <div className={styles.rowsContainer}>
                {RISK_LEVELS.map(item => (
                    <RiskRow
                        key={item.level}
                        level={item.level}
                        label={item.label}
                        range={item.range}
                        value={props.value}
                    />
                ))}
            </div>
        </motion.div>
    );
});

RiskBlock.blockStyles = styles;

//================================================================================
// 3. "Паспорт" блока
//================================================================================
RiskBlock.blockInfo = {
    type: 'custom/risk-block',
    label: 'Блок Уровня Риска',
    icon: <ShieldAlert />,
    description: 'Отображает уровень риска на цветной шкале.',
    keywords: ['риск', 'уровень', 'индикатор', 'опасность'],
    
    supports: { reusable: true, customClassName: true, anchor: true },

    defaultData: () => ({
        type: 'custom/risk-block',
        props: {
            title: 'Дисбаланс',
            value: 0,
            theme: 'light',
        },
        styles: {},
    }),

    getEditor: ({ block, onChange }) => {
        const { props } = block;
        const handlePropsChange = (newProps) => onChange({ props: { ...props, ...newProps } });

        return (
            <Tabs>
                <Tab title="Настройки">
                    <Input
                        label="Заголовок"
                        name="title"
                        value={props.title}
                        onChange={(e) => handlePropsChange({ title: e.target.value })}
                    />
                    <RangeControl
                        label="Значение"
                        value={props.value}
                        onChange={(val) => handlePropsChange({ value: val })}
                        min={0}
                        max={9}
                        step={1}
                    />
                    <Select
                        label="Тема"
                        value={props.theme}
                        options={[{ label: 'Светлая', value: 'light' }, { label: 'Темная', value: 'dark' }]}
                        onChange={(val) => handlePropsChange({ theme: val })}
                    />
                </Tab>
                <Tab title="Дополнительно">
                     <Input
                        label="HTML-якорь (ID)"
                        name="id"
                        value={props.id || ''}
                        onChange={(e) => handlePropsChange({ id: e.target.value })}
                    />
                </Tab>
            </Tabs>
        );
    }
};

export default withBlock(RiskBlock);