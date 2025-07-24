// src/components/blocks/charts/DetailedChart.jsx
import React, { useLayoutEffect, useRef } from 'react';
import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import am5themes_Dark from "@amcharts/amcharts5/themes/Dark";
import am5themes_Responsive from "@amcharts/amcharts5/themes/Responsive";
import am5locales_ru_RU from "@amcharts/amcharts5/locales/ru_RU";
import { configureSeries, createXAxis, createYAxis } from './chartUtils.js'; // Вынесем общие функции

const DetailedChart = ({ chartConfig, chartProps }) => {
    const chartRef = useRef(null);

    useLayoutEffect(() => {
        if (!chartRef.current || !chartConfig) return;

        let root = am5.Root.new(chartRef.current);
        root.locale = am5locales_ru_RU;
        root.setThemes([
            am5themes_Animated.new(root),
            chartProps.theme === 'dark' ? am5themes_Dark.new(root) : undefined,
            am5themes_Responsive.new(root)
        ].filter(Boolean));

        const chart = root.container.children.push(am5xy.XYChart.new(root, {
            panX: true, panY: true,
            wheelX: chartConfig.panX ? "panX" : "none",
            wheelY: chartConfig.zoomX ? "zoomX" : "none",
            pinchZoomX: true,
            layout: root.verticalLayout
        }));

        // Кастомизация кнопки ZoomOut как в старой версии
        if (chart.zoomOutButton) {
            chart.zoomOutButton.setAll({
                dx: 6, dy: -6, scale: 0.7
            });
            chart.zoomOutButton.get("background").setAll({ fillOpacity: 0.7 });
        }

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
                    tooltip: seriesConfig.noTooltip ? undefined : am5.Tooltip.new(root, { labelText: "{name}: {valueY}" })
                })
            );

            configureSeries(root, series, seriesConfig, chartConfig, chartProps);
            if (!seriesConfig.hideInLegend) {
                legendSeries.push(series);
            }
            series.data.setAll(seriesConfig.data);
            series.appear();
        });

        if (chartConfig.addCursor) {
            const cursor = chart.set("cursor", am5xy.XYCursor.new(root, {}));
            cursor.lineY.set("visible", false);
        }

        if (chartConfig.addLegend) {
            const legend = chart.bottomAxesContainer.children.push(am5.Legend.new(root, {
                width: am5.percent(100),
                oversizedBehavior: "wrap",
                truncate: true
            }));
            legend.data.setAll(legendSeries);
        }
        
        if (window.innerWidth >= 768) {
            if (chartConfig.addScrollbarX) {
                chart.set("scrollbarX", am5.Scrollbar.new(root, { orientation: "horizontal" }));
            }
            if (chartConfig.addScrollbarY) {
                chart.set("scrollbarY", am5.Scrollbar.new(root, { orientation: "vertical" }));
            }
        }
        
        chart.appear(1000, 100);

        return () => root.dispose();
    }, [chartConfig, chartProps]);

    return <div ref={chartRef} style={{ width: '100%', height: '100%' }} />;
};

export default DetailedChart;