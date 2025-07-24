// src/components/blocks/charts/chartUtils.js
import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";

const isValidColor = (color) => typeof color === 'string' && /^#([0-9A-F]{3}){1,2}$/i.test(color);

// Функция для создания оси X
export const createXAxis = (chart, root, chartConfig, chartProps) => {
    const xAxis = chart.xAxes.push(am5xy.DateAxis.new(root, {
        maxDeviation: chartConfig.maxDeviation || 0.2,
        baseInterval: {
            timeUnit: chartConfig.timeUnit === "quarter" ? "month" : chartConfig.timeUnit || "month",
            count: chartConfig.timeUnitCount || 1
        },
        renderer: am5xy.AxisRendererX.new(root, { minorGridEnabled: false }),
        tooltip: chartConfig.addXAxisTooltip ? am5.Tooltip.new(root, {}) : null
    }));

    if (isValidColor(chartProps.textColor)) {
        xAxis.get("renderer").labels.template.setAll({
            fill: am5.color(chartProps.textColor),
            fontSize: chartProps.axisLabelsTextSize || 14
        });
        if (xAxis.get("tooltip")) {
            xAxis.get("tooltip").label.set("fill", am5.color(chartProps.textColor));
        }
    }

    return xAxis;
};

// Функция для создания оси Y
export const createYAxis = (chart, root, chartConfig, chartProps, side, syncWithAxis = null) => {
    const isOpposite = side === "oposite";
    const prefix = isOpposite ? "oposite" : "";
    
    const yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
        renderer: am5xy.AxisRendererY.new(root, { pan: "zoom", opposite: isOpposite }),
        strictMinMax: chartConfig[`${prefix}StrictMinMax`] || false,
        syncWithAxis: syncWithAxis || undefined,
        calculateTotals: true,
    }));
    
    // Min/Max values
    if (chartConfig[`${prefix}AxisMinValue`]) yAxis.set("min", Number(chartConfig[`${prefix}AxisMinValue`]));
    if (chartConfig[`${prefix}AxisMaxValue`]) yAxis.set("max", Number(chartConfig[`${prefix}AxisMaxValue`]));

    // Text color
    if (isValidColor(chartProps.textColor)) {
        yAxis.get("renderer").labels.template.setAll({
            fill: am5.color(chartProps.textColor),
            fontSize: chartProps.axisLabelsTextSize || 14
        });
    }

    // Axis title
    const axisTitle = chartConfig[`${prefix}AxisTitle`];
    if (axisTitle) {
        const label = am5.Label.new(root, {
            text: axisTitle,
            textAlign: "center",
            y: am5.p50,
            rotation: -90,
            fontSize: chartProps.axisLabelsTextSize || 14,
            fill: isValidColor(chartProps.textColor) ? am5.color(chartProps.textColor) : (chartProps.theme === 'dark' ? '#ccccdc' : '#000000')
        });
        
        if(isOpposite) yAxis.children.push(label);
        else yAxis.children.unshift(label);
    }
    
    return yAxis;
};

// Функция для конфигурации серий
export const configureSeries = (root, series, seriesConfig, chartConfig, chartProps) => {
    // Настройки типа
    if (seriesConfig.seriesType === "LineSeries") {
        series.strokes.template.set("strokeWidth", seriesConfig.lineWidth || 1);
        if (seriesConfig.lineType === "dashed") {
            series.strokes.template.set("strokeDasharray", [10, 5]);
        }
        // 👇 ПРИМЕНЯЕМ ПРОЗРАЧНОСТЬ К ЛИНИЯМ
        series.strokes.template.set("opacity", seriesConfig.lineOpacity || 1);

    } else if (seriesConfig.seriesType === "ColumnSeries") {
        series.columns.template.set("width", am5.percent(seriesConfig.lineWidth || 100));
        // 👇 ПРИМЕНЯЕМ ПРОЗРАЧНОСТЬ К СТОЛБЦАМ
        series.columns.template.set("opacity", seriesConfig.lineOpacity || 1);
    }
    
    // Цвет
    if (seriesConfig.lineColor) {
        series.setAll({
            stroke: am5.color(seriesConfig.lineColor),
            fill: am5.color(seriesConfig.lineColor)
        });
    }

    // Градиент
    series.fills.template.setAll({
        fillGradient: am5.LinearGradient.new(root, {
            stops: [{
                opacity: Number(chartProps.seriesGradientOpacityEnd) || 0
            }, {
                opacity: Number(chartProps.seriesGradientOpacityStart) || 0
            }]
        }),
        visible: true
    });
    
    // Pre-zooming
    if (chartConfig.preZoomingStart && chartConfig.preZoomingEnd) {
        series.events.once('datavalidated', (ev) => {
            ev.target.get('xAxis').zoomToDates(new Date(chartConfig.preZoomingStart), new Date(chartConfig.preZoomingEnd));
        });
    }
};