// src/components/blocks/charts/SimpleChart.jsx
import React, { useLayoutEffect, useRef } from 'react';
import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import am5themes_Dark from "@amcharts/amcharts5/themes/Dark";
import * as am5locales_ru_RU from "@amcharts/amcharts5/locales/ru_RU";

const SimpleChart = ({ chartConfig, chartProps }) => {
    const chartRef = useRef(null);

    useLayoutEffect(() => {
        if (!chartRef.current || !chartConfig) return;

        let root = am5.Root.new(chartRef.current);
        root.locale = am5locales_ru_RU;
        root.setThemes([
            am5themes_Animated.new(root),
            chartProps.theme === 'dark' ? am5themes_Dark.new(root) : undefined
        ].filter(Boolean));

        // 1. Создание заголовка (как в старом коде)
        if (chartConfig.data?.length > 0) {
            const filteredData = chartConfig.data[0].data.filter(item => item.value !== null);
            const latestValue = filteredData.length > 0 ? filteredData[filteredData.length - 1].value : 0;
            const prevValue = filteredData.length > 1 ? filteredData[filteredData.length - 2].value : 0;
            const changeValue = latestValue - prevValue;
            const arrow = changeValue >= 0 ? '▲' : '▼';
            const changeColor = changeValue >= 0 ? 'rgba(123,192,109,0.8)' : 'rgba(233,69,88,0.8)';
            const textColor = chartProps.textColor || (chartProps.theme === 'dark' ? '#ccccdc' : '#000000');

            root.container.children.push(am5.Label.new(root, {
                html: `<div style="word-wrap: break-word;">
                           <div style="font-size: 16px; font-weight: 500; color: ${textColor}">${chartConfig.title}</div>
                           <span style="font-size: 28px; font-weight: bold; color: ${textColor}">${latestValue.toFixed(2)}</span>
                           <span style="font-size: 18px; font-weight: 500; color: ${changeColor};">(${Math.abs(changeValue).toFixed(2)} ${arrow})</span>
                       </div>
                       <span style="font-size: 14px; color: ${textColor}">${chartProps.unitValue || ''}</span>`,
                x: 0, y: 0, centerX: am5.percent(0), centerY: am5.percent(0),
                paddingLeft: 10, paddingTop: 10
            }));
        }

        // 2. Создание графика со сдвигом вниз
        const chart = root.container.children.push(am5xy.XYChart.new(root, {
            panX: false, panY: false, wheelX: "none", wheelY: "none",
            y: am5.percent(40), height: am5.percent(60),
            paddingLeft: 0, layout: root.verticalLayout,
            maxTooltipDistance: 1,
            interactive: false, // Отключаем всю интерактивность
            wheelable: false,
        }));
        chart.zoomOutButton.set('forceHidden', true);

        // 3. Настройка осей (максимально близко к старому коду)
        const xAxis = chart.xAxes.push(am5xy.DateAxis.new(root, {
            maxDeviation: chartConfig.maxDeviation || 0.2,
            baseInterval: {
                timeUnit: chartConfig.timeUnit === "quarter" ? "month" : chartConfig.timeUnit || "month",
                count: chartConfig.timeUnitCount || 1
            },
            renderer: am5xy.AxisRendererX.new(root, {
                minorGridEnabled: false,
                grid: { visible: false }, // Скрываем сетку
                labels: { visible: false } // Скрываем метки
            }),
            tooltip: null // В simple-версии тултип на оси не нужен
        }));
        xAxis.get("renderer").grid.template.set("visible", false);
        xAxis.get("renderer").labels.template.set("visible", false);

        const yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
            renderer: am5xy.AxisRendererY.new(root, {
                pan: "zoom",
                grid: { visible: false }, // Скрываем сетку
                labels: { visible: false } // Скрываем метки
            })
        }));
        yAxis.get("renderer").grid.template.set("visible", false);
        yAxis.get("renderer").labels.template.set("visible", false);

        // 4. Создание серии
        const firstSeriesConfig = chartConfig.data[0];
        if (firstSeriesConfig) {
            const series = chart.series.push(
                am5xy[firstSeriesConfig.seriesType || 'LineSeries'].new(root, {
                    xAxis, yAxis,
                    valueYField: "value",
                    valueXField: "date",
                    stacked: !!firstSeriesConfig.stacked,
                    tooltip: firstSeriesConfig.noTooltip ? undefined : am5.Tooltip.new(root, { labelText: "{valueY}" })
                })
            );

            if (firstSeriesConfig.lineColor) {
                series.setAll({
                    stroke: am5.color(firstSeriesConfig.lineColor),
                    fill: am5.color(firstSeriesConfig.lineColor)
                });
            }
             series.strokes.template.set("strokeWidth", firstSeriesConfig.lineWidth || 1);
            
            // Pre-zooming (если нужно)
            if (chartConfig.preZoomingStart && chartConfig.preZoomingEnd) {
                series.events.once('datavalidated', (ev) => {
                    ev.target.get('xAxis').zoomToDates(new Date(chartConfig.preZoomingStart), new Date(chartConfig.preZoomingEnd));
                });
            }

            series.data.setAll(firstSeriesConfig.data);
            series.appear();
        }

        chart.appear(1000, 100);

        return () => root.dispose();
    }, [chartConfig, chartProps]);

    return <div ref={chartRef} style={{ width: '100%', height: '100%' }} />;
};

export default SimpleChart;