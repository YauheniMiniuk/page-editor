// src/components/blocks/charts/CommonChart.jsx
import React, { useLayoutEffect, useRef } from 'react';
import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import am5themes_Dark from "@amcharts/amcharts5/themes/Dark";
import am5locales_ru_RU from "@amcharts/amcharts5/locales/ru_RU";
import { configureSeries, createXAxis, createYAxis } from './chartUtils.js'; // Вынесем общие функции

const CommonChart = ({ chartConfig, chartProps }) => {
    const chartRef = useRef(null);

    useLayoutEffect(() => {
        if (!chartRef.current || !chartConfig) return;

        let root = am5.Root.new(chartRef.current);
        root.locale = am5locales_ru_RU;
        root.setThemes([
            am5themes_Animated.new(root),
            chartProps.theme === 'dark' ? am5themes_Dark.new(root) : undefined
        ].filter(Boolean));

        const chart = root.container.children.push(am5xy.XYChart.new(root, {
            panX: false, panY: false, wheelX: "none", wheelY: "none",
            paddingLeft: 0, maxTooltipDistance: 1, layout: root.verticalLayout,
        }));
        chart.zoomOutButton.set('forceHidden', true);

        // Используем общие функции для создания осей, чтобы не дублировать код
        const xAxis = createXAxis(chart, root, chartConfig, chartProps);
        const yAxis = createYAxis(chart, root, chartConfig, chartProps, "left");
        const yAxisRight = chartConfig.addOpositeAxis ? createYAxis(chart, root, chartConfig, chartProps, "oposite", yAxis) : null;

        const legendSeries = [];
        chartConfig.data.forEach(seriesConfig => {
            const targetYAxis = seriesConfig.sideAxisY === "right" && yAxisRight ? yAxisRight : yAxis;
            const series = chart.series.push(
                am5xy[seriesConfig.seriesType || 'LineSeries'].new(root, {
                    name: seriesConfig.seriesTitle || seriesConfig.name,
                    xAxis, yAxis: targetYAxis,
                    valueYField: "value", valueXField: "date",
                    stacked: !!seriesConfig.stacked,
                    tooltip: seriesConfig.noTooltip ? undefined : am5.Tooltip.new(root, {
                        labelText: "{name}: {valueY}"
                    })
                })
            );

            configureSeries(root, series, seriesConfig, chartConfig, chartProps); // Настраиваем серию
            if (!seriesConfig.hideInLegend) {
                legendSeries.push(series);
            }
            series.data.setAll(seriesConfig.data);
            series.appear();
        });

        // Условное добавление курсора
        if (chartConfig.addCursor) {
            const cursor = chart.set("cursor", am5xy.XYCursor.new(root, { behavior: "none" }));
            cursor.lineY.set("visible", false);
        }

        // Условное добавление легенды
        if (chartConfig.addLegend) {
            const legend = chart.bottomAxesContainer.children.push(am5.Legend.new(root, {
                width: am5.percent(100),
                oversizedBehavior: "wrap"
            }));
            legend.data.setAll(legendSeries);
        }
        
        chart.appear(1000, 100);

        return () => root.dispose();
    }, [chartConfig, chartProps]);

    return <div ref={chartRef} style={{ width: '100%', height: '100%' }} />;
};

export default CommonChart;