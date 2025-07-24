import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import classNames from 'classnames';
import { BarChartIcon } from '../../utils/icons'; // Предположим, у вас есть иконка для графика
import { withBlock } from '../../hocs/withBlock';
import styles from './AmChartsBlock.module.css';
import ChartRenderer from './ChartRenderer.jsx'; // Наш будущий компонент, который будет рисовать график

// UI компоненты для панели настроек
import Tabs from '../../ui/Tabs';
import Tab from '../../ui/Tab';
import Input from '../../ui/Input';
import Select from '../../ui/Select';
import ColorPicker from '../../ui/ColorPicker';
import CustomUnitInput from '../../ui/CustomUnitInput';

//================================================================================
// 1. Компонент-обертка AmChartsBlock
//================================================================================
const AmChartsBlock = forwardRef(({ block, mode, className, style, ...rest }, ref) => {
    const { props = {} } = block;
    const isEditMode = mode === 'edit';

    // Показываем плейсхолдер, если нет ID графика (основной параметр)
    if (!props.chartID && isEditMode) {
        return (
            <div ref={ref} className={classNames(styles.placeholder, className)} style={style} {...rest}>
                <BarChartIcon />
                <span>Настройте ID графика в панели свойств</span>
            </div>
        );
    }
    
    if (!props.chartID && !isEditMode) {
        return null; // Ничего не показываем в режиме просмотра, если блок не настроен
    }
    
    return (
        <motion.div ref={ref} className={classNames(styles.wrapper, className)} style={{ ...block.styles, ...style }} {...rest}>
            {/* Вся логика рендеринга amCharts будет в этом компоненте */}
            <ChartRenderer chartProps={props} />
        </motion.div>
    );
});

AmChartsBlock.blockStyles = styles;

//================================================================================
// 2. "Паспорт" блока (blockInfo)
//================================================================================
AmChartsBlock.blockInfo = {
    type: 'custom/amcharts',
    label: 'График (amCharts)',
    icon: <BarChartIcon />,
    description: 'Отображает интерактивные графики amCharts по ID.',
    keywords: ['график', 'диаграмма', 'статистика', 'amcharts', 'chart'],

    defaultData: () => ({
        type: 'custom/amcharts',
        props: {
            // Переносим все атрибуты из WP сюда
            chartID: '',
            chartType: 'common',
            theme: 'light',
            textColor: '#000000',
            height: 400,
            titleTextSize: 20,
            axisLabelsTextSize: 14,
            legendTextSize: 16,
            tooltipTextSize: 16,
            seriesGradientOpacityStart: 0,
            seriesGradientOpacityEnd: 0,
            unitValue: ''
        },
        styles: {},
        variants: {},
    }),

    getToolbarItems: () => null, // Тулбар пока не нужен

    getEditor: ({ block, onChange }) => {
        const { props = {} } = block;
        
        // Удобная функция для обновления пропсов
        const handlePropsChange = (newProps) => {
            onChange({ props: { ...props, ...newProps } });
        };
        
        return (
            <Tabs>
                <Tab title="Основные">
                    <Input
                        label="ID графика"
                        value={props.chartID || ''}
                        onChange={(e) => handlePropsChange({ chartID: e.target.value })}
                        helpText="Уникальный ID для загрузки настроек и данных графика."
                    />
                    <Select
                        label="Тип графика"
                        value={props.chartType || 'common'}
                        options={[
                            { label: 'Обычный', value: 'common' },
                            { label: 'Мини', value: 'simple' },
                        ]}
                        onChange={(val) => handlePropsChange({ chartType: val })}
                    />
                    <CustomUnitInput
                        label="Высота блока"
                        value={props.height || 400}
                        units={['px', 'vh']}
                        onChange={(val) => handlePropsChange({ height: val })}
                    />
                </Tab>
                <Tab title="Оформление">
                     <Select
                        label="Тема"
                        value={props.theme || 'light'}
                        options={[
                            { label: 'Светлая', value: 'light' },
                            { label: 'Темная', value: 'dark' },
                        ]}
                        onChange={(val) => handlePropsChange({ theme: val })}
                    />
                    <ColorPicker
                        label="Цвет текста"
                        value={props.textColor || ''}
                        onChange={(color) => handlePropsChange({ textColor: color })}
                    />
                    {/* Здесь можно добавить остальные настройки размеров текста, градиентов и т.д. */}
                </Tab>
            </Tabs>
        );
    }
};

export default withBlock(AmChartsBlock);