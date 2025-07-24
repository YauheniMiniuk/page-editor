import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import classNames from 'classnames';
import { ActivitySquare } from 'lucide-react'; // Используем иконку из lucide

import { withBlock } from '../../hocs/withBlock';
import styles from './DisbalanceChartBlock.module.css'; // Наши стили
import Tabs from '../../ui/Tabs';
import Tab from '../../ui/Tab';
import Input from '../../ui/Input';
import Select from '../../ui/Select';
import RangeControl from '../../ui/RangeControl.jsx'; // Предположим, у нас есть или мы создадим такой UI-компонент

//================================================================================
// 1. Внутренние компоненты логики (перенесены из оригинала)
//================================================================================

const DisbalanceBlock = ({ value, isSelected }) => {
    const getColor = (val) => {
        if (val >= 1 && val <= 3) return styles.green;
        if (val >= 4 && val <= 6) return styles.yellow;
        return styles.red;
    };
    return (
        <div className={classNames(styles.block, getColor(value), { [styles.selected]: isSelected })}>
            {value}
        </div>
    );
};

const DisbalanceGroup = ({ start, end, selectedValue, label, color }) => (
    <div className={styles.group}>
        <div className={styles.groupBlocks}>
            {[...Array(end - start + 1)].map((_, i) => {
                const value = start + i;
                return <DisbalanceBlock key={value} value={value} isSelected={value == selectedValue} />;
            })}
        </div>
        <div className={styles.groupLabel} style={{ color }}>{label}</div>
    </div>
);

const DisbalanceChart = ({ value }) => (
    <div className={styles.chart}>
        <div className={styles.chartContainer}>
            <DisbalanceGroup start={1} end={3} selectedValue={value} label='Низкий' color="#7bc06d" />
            <DisbalanceGroup start={4} end={6} selectedValue={value} label='Средний' color="#eecd20" />
            <DisbalanceGroup start={7} end={9} selectedValue={value} label='Высокий' color="#e94558" />
        </div>
    </div>
);


//================================================================================
// 2. Главный компонент блока
//================================================================================
const DisbalanceChartBlock = forwardRef(({ block, className, style, ...rest }, ref) => {
    const { props = {} } = block;

    const finalClasses = classNames(
        styles.wrapper,
        {
            [styles.darkTheme]: props.theme === 'dark',
        },
        className,
    );

    return (
        <motion.div ref={ref} className={finalClasses} style={{ ...block.styles, ...style }} {...rest}>
            <DisbalanceChart value={props.value} />
        </motion.div>
    );
});

DisbalanceChartBlock.blockStyles = styles;


//================================================================================
// 3. "Паспорт" блока для нашего редактора
//================================================================================
DisbalanceChartBlock.blockInfo = {
    type: 'custom/disbalance-chart',
    label: 'График Дисбаланса',
    icon: <ActivitySquare />,
    description: 'Интерактивный график для отображения уровня риска или дисбаланса.',
    keywords: ['график', 'риск', 'индикатор', 'дисбаланс', 'chart'],

    supports: {
        reusable: true,
        customClassName: true,
        anchor: true,
    },

    defaultData: () => ({
        type: 'custom/disbalance-chart',
        props: {
            value: 5,
            theme: 'light',
        },
        styles: {},
    }),

    getEditor: ({ block, onChange }) => {
        const { props = {} } = block;

        const handlePropsChange = (newProps) => {
            onChange({ props: { ...props, ...newProps } });
        };

        return (
            <Tabs>
                <Tab title="Настройки">
                    {/* Для выбора значения лучше использовать слайдер, это интуитивнее */}
                    <RangeControl
                        label={`Значение: ${props.value}`}
                        value={props.value}
                        onChange={(newValue) => handlePropsChange({ value: newValue })}
                        min={1}
                        max={9}
                        step={1}
                    />

                    <Select
                        label="Тема компонента"
                        value={props.theme || 'light'}
                        options={[
                            { label: 'Светлая', value: 'light' },
                            { label: 'Темная', value: 'dark' },
                        ]}
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

export default withBlock(DisbalanceChartBlock);