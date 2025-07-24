// Определяем базовый URL вашего API для удобства.
// Если ваш бэкенд на другом домене, укажите его здесь (например, 'https://my-api.com/api').
const API_BASE_URL = '/api';

/**
 * Вспомогательная функция для обработки ответов от API.
 * Проверяет, успешен ли запрос, и выбрасывает ошибку, если нет.
 * @param {Response} response - Объект ответа от fetch.
 * @returns {Promise<any>} - JSON-данные из ответа.
 */
async function handleResponse(response) {
    if (!response.ok) {
        const errorData = await response.text();
        // Создаём осмысленную ошибку для лучшей отладки.
        throw new Error(`Ошибка API: ${response.status} - ${errorData || response.statusText}`);
    }
    return response.json();
}

/**
 * Запрашивает настройки конкретного графика по его ID.
 * @param {string} chartId - Уникальный ID графика.
 * @returns {Promise<object>} - Объект с настройками графика (включая поле `settings`).
 */
export async function fetchChart(chartId) {
    if (!chartId) {
        throw new Error("Необходимо указать ID графика для загрузки настроек.");
    }

    const response = await fetch(`${API_BASE_URL}/chart/${chartId}`);
    return handleResponse(response);
}

/**
 * Запрашивает данные (точки) для графика на основе параметров.
 * @param {string} paramsString - Строка URL-параметров (например, 'tableData[0][tableName]=...').
 * @returns {Promise<Array>} - Массив с данными для серий графика.
 */
export async function fetchChartData(paramsString) {
    const response = await fetch(`${API_BASE_URL}/chartData?${paramsString}`);
    return handleResponse(response);
}