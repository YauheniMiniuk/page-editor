import React, { useEffect, useState } from 'react';
import { fetchChart, fetchChartData } from '../../api/chartApi';

// Новые дочерние компоненты
import SimpleChart from './charts/SimpleChart';
import CommonChart from './charts/CommonChart';
import DetailedChart from './charts/DetailedChart';

// UI
import Modal from '../../ui/Modal';
import IconButton from '../../ui/IconButton';
import { MaximizeIcon } from 'lucide-react';

const ChartRenderer = ({ chartProps }) => {
    const [chartConfig, setChartConfig] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        if (!chartProps.chartID) {
            setIsLoading(false);
            setChartConfig(null);
            return;
        }
        const loadData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const config = await fetchChart(chartProps.chartID);

                let settings = config.settings;
                if (typeof settings === 'string') {
                    try {
                        settings = JSON.parse(settings);
                    } catch (e) {
                        console.error("Не удалось распарсить настройки графика:", e);
                        settings = {}; // В случае ошибки используем пустые настройки
                    }
                }
                // Убедимся, что settings - это объект, а не null/undefined
                settings = settings || {};

                // Проверяем, есть ли вообще данные для запроса
                if (!settings.data || settings.data.length === 0) {
                    setChartConfig(settings);
                    return; // Выходим, если нечего запрашивать
                }

                const params = new URLSearchParams();
                settings.data.forEach((data, index) => {
                    params.append(`tableData[${index}][tableName]`, data.tableName);
                    params.append(`tableData[${index}][startDate]`, data.startDate || "");
                    params.append(`tableData[${index}][endDate]`, data.endDate || "");
                });

                const rawData = await fetchChartData(params.toString());
                settings.data = rawData.filter(item => item != null).map((series, index) => ({
                    ...settings.data[index],
                    name: series.name,
                    data: series.data.map(item => ({ date: item.date, value: item.value !== null ? Number(item.value) : null }))
                }));

                setChartConfig(settings);
            } catch (err) {
                setError(err.message);
                console.error("Ошибка загрузки данных для графика:", err);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [chartProps.chartID]);

    if (isLoading) {
        return <div style={{ height: chartProps.height || 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Загрузка графика...</div>;
    }
    if (error) {
        return <div style={{ height: chartProps.height || 400, color: 'red', padding: '1rem' }}>Ошибка: {error}</div>;
    }
    if (!chartConfig && chartProps.chartID) {
        return <div style={{ height: chartProps.height || 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Нет данных для графика.</div>;
    }

    // Если chartID не указан, ничего не рендерим
    if (!chartProps.chartID) {
        return null;
    }

    return (
        <div style={{ position: 'relative', width: '100%', height: chartProps.height || 400 }}>
            {chartProps.chartType === 'common' && chartConfig && (
                <IconButton
                    tooltip="Детализация"
                    onClick={() => setIsModalOpen(true)}
                    style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 10 }}
                >
                    <MaximizeIcon />
                </IconButton>
            )}

            {chartConfig && (chartProps.chartType === 'simple' ?
                <SimpleChart chartConfig={chartConfig} chartProps={chartProps} /> :
                <CommonChart chartConfig={chartConfig} chartProps={chartProps} />
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={chartConfig?.title || "Детализация графика"}
                style={{ width: '80vw', height: '80vh', maxWidth: '1280px' }}
            >
                {chartConfig && <DetailedChart chartConfig={chartConfig} chartProps={chartProps} />}
            </Modal>
        </div>
    );
};

export default ChartRenderer;
