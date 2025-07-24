import React, { forwardRef, useLayoutEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import classNames from 'classnames';
import { BarChartHorizontalBig, Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { nanoid } from 'nanoid';

// AmCharts Imports
import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import am5themes_Dark from "@amcharts/amcharts5/themes/Dark";
import am5locales_ru_RU from "@amcharts/amcharts5/locales/ru_RU";

// Our UI Components
import { withBlock } from '../../hocs/withBlock';
import styles from './RiskProfileChartBlock.module.css';
import Tabs from '../../ui/Tabs';
import Tab from '../../ui/Tab';
import Input from '../../ui/Input';
import Select from '../../ui/Select';
import Button from '../../ui/Button';
import CustomUnitInput from '../../ui/CustomUnitInput';

//================================================================================
// 1. Компонент-отрисовщик графика
//================================================================================
const ChartRenderer = ({ settings }) => {
    const chartRef = useRef(null);

    useLayoutEffect(() => {
        if (!chartRef.current) return;

        const root = am5.Root.new(chartRef.current);
        root.locale = am5locales_ru_RU;

        const themes = [am5themes_Animated.new(root)];
        if (settings.theme === 'dark') {
            themes.push(am5themes_Dark.new(root));
        }
        root.setThemes(themes);

        const chart = root.container.children.push(am5xy.XYChart.new(root, {
            panX: false, panY: false, wheelX: "none", wheelY: "none", layout: root.verticalLayout
        }));

        const yRenderer = am5xy.AxisRendererY.new(root, { minGridDistance: 10, inversed: true });
        yRenderer.labels.template.setAll({
            fontSize: "14px", paddingRight: 15, oversizedBehavior: "truncate", maxWidth: 150
        });

        const yAxis = chart.yAxes.push(am5xy.CategoryAxis.new(root, {
            categoryField: "name", renderer: yRenderer
        }));

        const xAxis = chart.xAxes.push(am5xy.ValueAxis.new(root, {
            strictMinMax: true,
            min: settings.axisMin, max: settings.axisMax, renderer: am5xy.AxisRendererX.new(root, {})
        }));

        const series = chart.series.push(am5xy.ColumnSeries.new(root, {
            name: "Value", yAxis, xAxis,
            valueXField: "value", categoryYField: "name",
            sequencedInterpolation: true,
            tooltip: am5.Tooltip.new(root, { labelText: "{categoryY}: {valueX}" })
        }));

        series.columns.template.setAll({
            height: am5.percent(80), strokeOpacity: 0
        });

        // Адаптер для цвета колонок, как в твоей новой версии
        series.columns.template.adapters.add("fill", (fill, target) => {
            const value = Math.abs(target.dataItem.get("valueX")) || 0;
            if (value >= 7) return am5.color(0xe94558); // red
            if (value >= 4) return am5.color(0xeecd20); // yellow
            return am5.color(0x7bc06d); // green
        });

        // // Добавляем маркер для предыдущего значения (prevValue)
        // series.bullets.push(() => {
        //     return am5.Bullet.new(root, {
        //         locationX: 1, // Располагаем в конце значения value
        //         sprite: am5.Circle.new(root, {
        //             radius: 4,
        //             fill: series.get("fill"),
        //             stroke: root.interfaceColors.get("background"),
        //             strokeWidth: 2
        //         }),
        //         // Динамически устанавливаем позицию маркера на оси X
        //         dynamic: true
        //     });
        // });

        // // Привязываем позицию маркера к prevValue
        // series.bullets.each(function (bullet) {
        //     // Используем прямое свойство .sprite
        //     const sprite = bullet.sprite;

        //     if (sprite) {
        //         // Привязываем dataItem к самому спрайту
        //         sprite.dataItem = bullet.dataItem;

        //         // Добавляем адаптер на спрайт
        //         sprite.adapters.add("x", function (x, target) {
        //             const dataItem = target.dataItem;
        //             if (dataItem) {
        //                 // Здесь .get() используется правильно, так как dataItem его поддерживает
        //                 const value = dataItem.get("prevValue", 0);
        //                 return xAxis.valueToPosition(value) * chart.plotContainer.width();
        //             }
        //             return x;
        //         });
        //     }
        // });

        yAxis.data.setAll(settings.data);
        series.data.setAll(settings.data);
        series.appear();

        return () => { root.dispose(); };
    }, [settings]);

    return <div ref={chartRef} style={{ width: '100%', height: settings.height }}></div>;
};

//================================================================================
// 2. Главный компонент блока
//================================================================================
const RiskProfileChartBlock = forwardRef(({ block, className, style, ...rest }, ref) => (
    <motion.div ref={ref} className={classNames(styles.wrapper, className)} style={{ ...block.styles, ...style }} {...rest}>
        <h4 className={styles.title}>{block.props.title}</h4>
        <ChartRenderer settings={block.props} />
    </motion.div>
));

RiskProfileChartBlock.blockStyles = styles;

//================================================================================
// 3. "Паспорт" блока
//================================================================================
RiskProfileChartBlock.blockInfo = {
    type: 'custom/risk-profile-chart',
    label: 'Профиль Рисков (Гистограмма)',
    icon: <BarChartHorizontalBig />,
    description: 'Горизонтальная гистограмма для отображения профиля рисков.',
    keywords: ['риск', 'профиль', 'гистограмма', 'график', 'bar chart'],
    supports: { reusable: true, customClassName: true, anchor: true },

    defaultData: () => ({
        type: 'custom/risk-profile-chart',
        props: {
            title: "Профиль рисков",
            height: 300,
            theme: 'light',
            axisMin: 0,
            axisMax: 10,
            data: [
                { id: nanoid(), name: "Столбец 1", value: 2 },
                { id: nanoid(), name: "Столбец 2", value: 5},
                { id: nanoid(), name: "Столбец 3", value: 7 },
            ]
        },
        styles: {},
    }),

    getEditor: ({ block, onChange }) => {
        const { props } = block;
        const handlePropsChange = (newProps) => onChange({ props: { ...props, ...newProps } });

        const handleDataChange = (index, field, value) => {
            const newData = [...props.data];
            newData[index] = { ...newData[index], [field]: value };
            handlePropsChange({ data: newData });
        };
        const addData = () => handlePropsChange({ data: [...props.data, { id: nanoid(), name: 'Новый риск', value: 5, prevValue: 5 }] });
        const removeData = (index) => handlePropsChange({ data: props.data.filter((_, i) => i !== index) });

        // Функция для изменения порядка
        const moveItem = (index, direction) => {
            const newIndex = index + direction;
            if (newIndex < 0 || newIndex >= props.data.length) return;
            const newData = [...props.data];
            [newData[index], newData[newIndex]] = [newData[newIndex], newData[index]]; // Swap
            handlePropsChange({ data: newData });
        };

        return (
            <Tabs>
                <Tab title="Основные">
                    <Input label="Заголовок" value={props.title} onChange={(e) => handlePropsChange({ title: e.target.value })} />
                    <CustomUnitInput label="Высота" value={props.height} onChange={(val) => handlePropsChange({ height: val })} units={['px', 'vh']} />
                    <Select label="Тема" value={props.theme} options={[{ label: 'Светлая', value: 'light' }, { label: 'Темная', value: 'dark' }]} onChange={(val) => handlePropsChange({ theme: val })} />
                    <div className={styles.axisRow}>
                        <Input label="Min оси" type="number" value={props.axisMin} onChange={(e) => handlePropsChange({ axisMin: Number(e.target.value) })} />
                        <Input label="Max оси" type="number" value={props.axisMax} onChange={(e) => handlePropsChange({ axisMax: Number(e.target.value) })} />
                    </div>
                </Tab>
                <Tab title="Данные">
                    <div className={styles.dataList}>
                        {props.data.map((item, index) => (
                            <div key={item.id} className={styles.dataRow}>
                                <div className={styles.dataInputs}>
                                    <Input label="Название" value={item.name} onChange={(e) => handleDataChange(index, 'name', e.target.value)} />
                                    <div className={styles.axisRow}>
                                        <Input label="Значение" type="number" value={item.value} onChange={(e) => handleDataChange(index, 'value', Number(e.target.value))} />
                                        <Input label="Пред." type="number" value={item.prevValue} onChange={(e) => handleDataChange(index, 'prevValue', Number(e.target.value))} />
                                    </div>
                                </div>
                                <div className={styles.dataControls}>
                                    <Button small onClick={() => moveItem(index, -1)} disabled={index === 0}><ArrowUp size={14} /></Button>
                                    <Button small onClick={() => moveItem(index, 1)} disabled={index === props.data.length - 1}><ArrowDown size={14} /></Button>
                                    <Button small danger onClick={() => removeData(index)}><Trash2 size={14} /></Button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <Button onClick={addData}><Plus size={16} /> Добавить элемент</Button>
                </Tab>
            </Tabs>
        );
    }
};

export default withBlock(RiskProfileChartBlock);