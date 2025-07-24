import React, { forwardRef, useLayoutEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import classNames from 'classnames';
import { ScatterChart, Plus, Trash2 } from 'lucide-react';
import { nanoid } from 'nanoid';

// AmCharts Imports
import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import am5themes_Dark from "@amcharts/amcharts5/themes/Dark";
import am5locales_ru_RU from "@amcharts/amcharts5/locales/ru_RU";

// Our UI Components
import { withBlock } from '../../hocs/withBlock';
import styles from './BubbleChartBlock.module.css';
import Tabs from '../../ui/Tabs';
import Tab from '../../ui/Tab';
import Input from '../../ui/Input';
import Select from '../../ui/Select';
import Textarea from '../../ui/Textarea';
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
            panX: false, panY: false, wheelY: null, pinchZoomX: false, pinchZoomY: false,
        }));

        const xAxis = chart.xAxes.push(am5xy.ValueAxis.new(root, {
            strictMinMax: true,
            renderer: am5xy.AxisRendererX.new(root, { minGridDistance: 50 }),
            tooltip: am5.Tooltip.new(root, {})
        }));
        xAxis.children.moveValue(am5.Label.new(root, { text: settings.xAxisLabel, textAlign: 'center', x: am5.p50 }), 0);

        const yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
            strictMinMax: true,
            renderer: am5xy.AxisRendererY.new(root, {}),
            tooltip: am5.Tooltip.new(root, {})
        }));
        yAxis.children.moveValue(am5.Label.new(root, { text: settings.yAxisLabel, rotation: -90, textAlign: 'center', y: am5.p50 }), 0);

        // --- ИЗМЕНЕНИЕ: Логика установки границ осей ---
        // Сначала рассчитываем автоматические значения как fallback
        if (settings.dataPoints && settings.dataPoints.length > 0) {
            const xValues = settings.dataPoints.map(p => p.x);
            const yValues = settings.dataPoints.map(p => p.y);
            const minX = Math.min(...xValues);
            const minY = Math.min(...yValues);
            const maxX = Math.max(...xValues);
            const maxY = Math.max(...yValues);
            const xPadding = (maxX - minX) * 0.15 || 1;
            const yPadding = (maxY - minY) * 0.15 || 1;

            // Устанавливаем границы: используем ручные настройки, если они есть, иначе - автоматические
            xAxis.setAll({
                min: settings.minX ?? (minX - xPadding),
                max: settings.maxX ?? (maxX + xPadding)
            });
            yAxis.setAll({
                min: settings.minY ?? (minY - yPadding),
                max: settings.maxY ?? (maxY + yPadding)
            });
        }
        
        const quadrantFill = am5.color(root.interfaceColors.get("grid"));
        const rectSeries1 = chart.series.push(am5xy.LineSeries.new(root, { xAxis, yAxis, valueYField: "y", valueXField: "x" }));
        rectSeries1.strokes.template.set("forceHidden", true);
        rectSeries1.fills.template.setAll({ fill: quadrantFill, fillOpacity: 0.1, visible: true });
        rectSeries1.data.setAll([{ x: 0, y: 0 }, { x: 1000, y: 0 }, { x: 1000, y: 1000 }, { x: 0, y: 1000 }]);
        const rectSeries2 = chart.series.push(am5xy.LineSeries.new(root, { xAxis, yAxis, valueYField: "y", valueXField: "x" }));
        rectSeries2.strokes.template.set("forceHidden", true);
        rectSeries2.fills.template.setAll({ fill: quadrantFill, fillOpacity: 0.1, visible: true });
        rectSeries2.data.setAll([{ x: 0, y: 0 }, { x: -1000, y: 0 }, { x: -1000, y: -1000 }, { x: 0, y: -1000 }]);

        const createCornerLabel = (text, x, y, centerX, centerY, textAlign) => {
            chart.plotContainer.children.push(am5.Label.new(root, {
                html: `<p style="font-size:0.8em; opacity:0.7; max-width:150px; line-height:1.2;">${text}</p>`,
                x, y, centerX, centerY, textAlign,
            }));
        };
        createCornerLabel(settings.quadrantLabels[0], am5.p100, am5.p0, am5.p100, am5.p0, "right");
        createCornerLabel(settings.quadrantLabels[1], am5.p100, am5.p100, am5.p100, am5.p100, "right");
        createCornerLabel(settings.quadrantLabels[2], am5.p0, am5.p100, am5.p0, am5.p100, "left");
        createCornerLabel(settings.quadrantLabels[3], am5.p0, am5.p0, am5.p0, am5.p0, "left");

        const dataSeries = chart.series.push(am5xy.LineSeries.new(root, { xAxis, yAxis, valueYField: "y", valueXField: "x", valueField: "size" }));
        dataSeries.strokes.template.set("strokeOpacity", 0);
        
        const circleTemplate = am5.Template.new({});
        dataSeries.bullets.push(() => {
            const bulletContainer = am5.Container.new(root, {
                cursorOverStyle: "pointer",
                tooltipText: "{value}",
                layout: root.horizontalLayout, 
            });
            bulletContainer.children.push(am5.Circle.new(root, { fillOpacity: 0.7, fill: dataSeries.get("fill") }, circleTemplate));
            bulletContainer.children.push(am5.Label.new(root, {
                text: "{value}",
                populateText: true,
                fontSize: "0.9em",
                fontWeight: "500",
                paddingLeft: 6, 
                centerY: am5.p50 
            }));
            return am5.Bullet.new(root, { sprite: bulletContainer });
        });
        
        dataSeries.set("heatRules", [{ target: circleTemplate, dataField: "size", min: 5, max: 20, key: "radius" }]);
        dataSeries.data.setAll(settings.dataPoints);

        return () => { root.dispose(); };
    }, [settings]);

    return <div ref={chartRef} style={{ width: '100%', height: settings.height }}></div>;
};

//================================================================================
// 2. Главный компонент блока (без изменений)
//================================================================================
const BubbleChartBlock = forwardRef(({ block, className, style, ...rest }, ref) => (
    <motion.div ref={ref} className={classNames(styles.wrapper, className)} style={{...block.styles, ...style}} {...rest}>
        <ChartRenderer settings={block.props} />
    </motion.div>
));

BubbleChartBlock.blockStyles = styles;

//================================================================================
// 3. "Паспорт" блока
//================================================================================
BubbleChartBlock.blockInfo = {
    type: 'custom/bubble-chart',
    label: 'Пузырьковая диаграмма',
    icon: <ScatterChart />,
    description: 'Интерактивная пузырьковая диаграмма для отображения данных на XY-оси.',
    keywords: ['график', 'пузырьки', 'диаграмма', 'amcharts', 'scatter'],
    supports: { reusable: true, customClassName: true, anchor: true },

    defaultData: () => ({
        type: 'custom/bubble-chart',
        props: {
            xAxisLabel: "Изменение темпов роста ВВП",
            yAxisLabel: "Фискальный импульс",
            height: 500,
            theme: 'light',
            // --- ИЗМЕНЕНИЕ: Добавлены поля для ручной настройки осей ---
            minX: null,
            maxX: null,
            minY: null,
            maxY: null,
            dataPoints: [
                { "y": 3.35, "x": -2.11, "value": "2020", "size": 10 },
                { "y": -1.15, "x": 3.11, "value": "2021", "size": 15 },
                { "y": -0.05, "x": -7.09, "value": "2022", "size": 8 },
                { "y": -1.99, "x": 8.54, "value": "2023", "size": 18 },
                { "y": 0.65, "x": 1.48, "value": "2024*", "size": 12 }
            ],
            quadrantLabels: [
                "<b>Проциклическая политика:</b><br/>ускорение экономики сопровождается увеличением государственых расходов",
                "<b>Контрциклическая политика:</b><br/>ускорение экономики сопровождается сокращением государственых расходов",
                "<b>Проциклическая политика:</b><br/>замедление экономики сопровождается сокращением государственых расходов",
                "<b>Контрциклическая политика:</b><br/>замедление экономики сопровождается увеличением государственых расходов"
            ]
        },
        styles: {},
    }),

    getEditor: ({ block, onChange }) => {
        const { props } = block;
        
        // Обработчик для полей, которые могут быть пустыми (null)
        const handleAxisChange = (field, value) => {
            const num = parseFloat(value);
            onChange({ props: { ...props, [field]: isNaN(num) ? null : num } });
        };

        const handlePropsChange = (newProps) => onChange({ props: { ...props, ...newProps } });

        const handleDataPointChange = (index, field, value) => {
            const newDataPoints = [...props.dataPoints];
            newDataPoints[index] = { ...newDataPoints[index], [field]: value };
            handlePropsChange({ dataPoints: newDataPoints });
        };
        const addDataPoint = () => handlePropsChange({ dataPoints: [...props.dataPoints, { x: 0, y: 0, value: 'Новая точка', size: 10, id: nanoid() }]});
        const removeDataPoint = (index) => handlePropsChange({ dataPoints: props.dataPoints.filter((_, i) => i !== index) });
        
        const handleLabelChange = (index, value) => {
            const newLabels = [...props.quadrantLabels];
            newLabels[index] = value;
            handlePropsChange({ quadrantLabels: newLabels });
        };

        return (
            <Tabs>
                <Tab title="Основные">
                    <Input label="Подпись оси X" value={props.xAxisLabel} onChange={(e) => handlePropsChange({ xAxisLabel: e.target.value })} />
                    <Input label="Подпись оси Y" value={props.yAxisLabel} onChange={(e) => handlePropsChange({ yAxisLabel: e.target.value })} />
                    <CustomUnitInput label="Высота" value={props.height} onChange={(val) => handlePropsChange({ height: val })} units={['px', 'vh']} />
                    <Select label="Тема" value={props.theme} options={[{ label: 'Светлая', value: 'light' }, { label: 'Темная', value: 'dark' }]} onChange={(val) => handlePropsChange({ theme: val })}/>
                    <hr/>
                    <h4>Границы осей (оставьте пустым для авто)</h4>
                    <div className={styles.axisRow}>
                        <Input label="Min X" type="number" value={props.minX ?? ''} onChange={(e) => handleAxisChange('minX', e.target.value)} />
                        <Input label="Max X" type="number" value={props.maxX ?? ''} onChange={(e) => handleAxisChange('maxX', e.target.value)} />
                    </div>
                     <div className={styles.axisRow}>
                        <Input label="Min Y" type="number" value={props.minY ?? ''} onChange={(e) => handleAxisChange('minY', e.target.value)} />
                        <Input label="Max Y" type="number" value={props.maxY ?? ''} onChange={(e) => handleAxisChange('maxY', e.target.value)} />
                    </div>
                </Tab>
                <Tab title="Точки данных">
                    {props.dataPoints.map((point, index) => (
                        <div key={point.id || index} className={styles.dataRow}>
                            <Input label="X" type="number" value={point.x} onChange={(e) => handleDataPointChange(index, 'x', Number(e.target.value))} />
                            <Input label="Y" type="number" value={point.y} onChange={(e) => handleDataPointChange(index, 'y', Number(e.target.value))} />
                            <Input label="Размер" type="number" value={point.size} onChange={(e) => handleDataPointChange(index, 'size', Number(e.target.value))} />
                            <Input label="Подпись" value={point.value} onChange={(e) => handleDataPointChange(index, 'value', e.target.value)} />
                            <Button small danger onClick={() => removeDataPoint(index)}><Trash2 size={14} /></Button>
                        </div>
                    ))}
                    <Button onClick={addDataPoint}><Plus size={16} /> Добавить точку</Button>
                </Tab>
                <Tab title="Подписи квадрантов">
                    <Textarea label="Верхний правый" rows={3} value={props.quadrantLabels[0]} onChange={(e) => handleLabelChange(0, e.target.value)} />
                    <Textarea label="Нижний правый" rows={3} value={props.quadrantLabels[1]} onChange={(e) => handleLabelChange(1, e.target.value)} />
                    <Textarea label="Нижний левый" rows={3} value={props.quadrantLabels[2]} onChange={(e) => handleLabelChange(2, e.target.value)} />
                    <Textarea label="Верхний левый" rows={3} value={props.quadrantLabels[3]} onChange={(e) => handleLabelChange(3, e.target.value)} />
                </Tab>
            </Tabs>
        );
    }
};

export default withBlock(BubbleChartBlock);