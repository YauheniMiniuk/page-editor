import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import classNames from 'classnames';
import { Gauge } from 'lucide-react'; // Отличная иконка для этого блока

import { withBlock } from '../../hocs/withBlock';
import styles from './RiskChartBlock.module.css'; // Стили для этого блока
import Tabs from '../../ui/Tabs';
import Tab from '../../ui/Tab';
import Input from '../../ui/Input';
import Select from '../../ui/Select';
import RangeControl from '../../ui/RangeControl';

//================================================================================
// 1. Константы и Внутренние компоненты
//================================================================================

const RISK_BLOCKS = [
    { label: 'высокий', range: [-9, -7], colorClass: 'high' },
    { label: 'средний', range: [-6, -4], colorClass: 'medium' },
    { label: 'низкий', range: [-3, -1], colorClass: 'low' },
    { label: '0', range: [0, 0], colorClass: 'neutral' },
    { label: 'низкий', range: [1, 3], colorClass: 'low' },
    { label: 'средний', range: [4, 6], colorClass: 'medium' },
    { label: 'высокий', range: [7, 9], colorClass: 'high' }
];

const getBlockIndex = (value) => RISK_BLOCKS.findIndex(b => value >= b.range[0] && value <= b.range[1]);

const ArrowDownIcon = () => (
    <svg className={styles.arrowSvg} xmlns="http://www.w3.org/2000/svg" height="36px" viewBox="0 -960 960 960" width="36px"><path d="M480-360 280-560h400L480-360Z" /></svg>
);

const RiskSegment = ({ config, isActive, value }) => {
    // Для обычных блоков определяем, в какой из 3 частей находится стрелка
    const partIndex = Math.floor(((value - config.range[0]) / (config.range[1] - config.range[0] + 1)) * 3);
    const arrowPosition = ["15%", "50%", "85%"];

    const isBaseBlock = config.label === '0';
    const blockClasses = classNames(
        isBaseBlock ? styles.baseRiskBlock : styles.riskBlock,
        styles[config.colorClass],
        { [styles.active]: isActive }
    );

    return (
        <div className={blockClasses}>
            {isActive && (
                <div className={styles.arrow} style={{ left: isBaseBlock ? '50%' : arrowPosition[partIndex] }}>
                    <ArrowDownIcon />
                </div>
            )}
            <span className={styles.blockLabel}>{config.label}</span>
        </div>
    );
};

const RiskChart = ({ value }) => {
    const activeIndex = getBlockIndex(value);
    return (
        <div className={styles.chart}>
            <div className={styles.chartContainer}>
                {RISK_BLOCKS.map((block, index) => (
                    <RiskSegment
                        key={index}
                        config={block}
                        isActive={activeIndex === index}
                        value={value}
                    />
                ))}
            </div>
            <div className={styles.labels}>
                <div className={styles.labelGroup}>
                    <svg viewBox="0 0 140 10" preserveAspectRatio="none"><line x1="0" y1="5" x2="140" y2="5"/><polygon points="10,0 0,5 10,10" /></svg>
                    <span>Дезинфляционные</span>
                </div>
                <div className={classNames(styles.labelGroup, styles.right)}>
                    <svg viewBox="0 0 140 10" preserveAspectRatio="none"><line x1="0" y1="5" x2="140" y2="5"/><polygon points="10,0 0,5 10,10" /></svg>
                    <span>Проинфляционные</span>
                </div>
            </div>
        </div>
    );
};

//================================================================================
// 2. Главный компонент блока
//================================================================================
const RiskChartBlock = forwardRef(({ block, className, style, ...rest }, ref) => {
    const { props = {} } = block;
    const finalClasses = classNames(
        styles.wrapper,
        { [styles.darkTheme]: props.theme === 'dark' },
        className
    );
    return (
        <motion.div ref={ref} className={finalClasses} style={{...block.styles, ...style}} {...rest}>
            <RiskChart value={props.value} />
        </motion.div>
    );
});

RiskChartBlock.blockStyles = styles;

//================================================================================
// 3. "Паспорт" блока
//================================================================================
RiskChartBlock.blockInfo = {
    type: 'custom/risk-chart',
    label: 'График Профиля Рисков',
    icon: <Gauge />,
    description: 'Отображает профиль риска на шкале от -9 до 9.',
    keywords: ['риск', 'график', 'профиль', 'инфляция', 'gauge'],
    
    supports: {
        reusable: true,
        customClassName: true,
        anchor: true,
    },

    defaultData: () => ({
        type: 'custom/risk-chart',
        props: {
            value: 0,
            theme: 'light',
        },
        styles: {},
    }),

    getEditor: ({ block, onChange }) => {
        const { props = {} } = block;
        const handlePropsChange = (newProps) => onChange({ props: { ...props, ...newProps } });
        
        return (
            <Tabs>
                <Tab title="Настройки">
                    <RangeControl
                        label="Значение риска"
                        value={props.value}
                        onChange={(val) => handlePropsChange({ value: val })}
                        min={-9}
                        max={9}
                        step={1}
                    />
                    <Select
                        label="Тема компонента"
                        value={props.theme || 'light'}
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

export default withBlock(RiskChartBlock);