// Определяем базовый URL вашего API.
const API_BASE_URL = '/api';

/**
 * Вспомогательная функция для обработки ответов от API.
 * @param {Response} response - Объект ответа от fetch.
 * @returns {Promise<any>} - JSON-данные из ответа.
 */
async function handleResponse(response) {
    if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Ошибка API: ${response.status} - ${errorData || response.statusText}`);
    }
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
        return response.json();
    }
    return {};
}

// --- Функции для управления списком графиков ---

/**
 * Запрашивает общее количество графиков (для пагинации).
 * @param {object} params - Параметры.
 * @param {string} params.name - Строка для поиска по названию.
 * @returns {Promise<{count: number}>} - Объект с количеством графиков.
 */
export async function fetchChartsCount({ name = '' } = {}) {
    const response = await fetch(`${API_BASE_URL}/v2/charts/count?name=${encodeURIComponent(name)}`);
    return handleResponse(response);
}

/**
 * Запрашивает страницу со списком графиков.
 * @param {object} params - Параметры.
 * @param {number} params.page - Номер страницы.
 * @param {string} params.name - Строка для поиска по названию.
 * @returns {Promise<Array>} - Массив с графиками.
 */
export async function fetchChartsList({ page = 1, name = '' } = {}) {
    const response = await fetch(`${API_BASE_URL}/v2/charts/page/${page}?name=${encodeURIComponent(name)}`);
    return handleResponse(response);
}

// --- Функции для работы с конкретным графиком ---

/**
 * Запрашивает настройки конкретного графика по его ID.
 * @param {string|number} chartId - Уникальный ID графика.
 * @returns {Promise<object>} - Объект с данными графика.
 */
export async function fetchChart(chartId) {
    if (!chartId) throw new Error("Необходимо указать ID графика.");
    const response = await fetch(`${API_BASE_URL}/v2/charts/${chartId}`);
    return handleResponse(response);
}

/**
 * Создает новый пустой график.
 * @returns {Promise<{id: number}>} - Объект с ID нового графика.
 */
export async function createNewChart() {
    const response = await fetch(`${API_BASE_URL}/v2/charts`, {
        method: 'POST',
    });
    return handleResponse(response);
}

/**
 * Обновляет настройки графика.
 * @param {string|number} chartId - ID обновляемого графика.
 * @param {object} settings - Новый объект с настройками.
 * @returns {Promise<object>} - Ответ от сервера.
 */
export async function updateChart(chartId, settings) {
    if (!chartId) throw new Error("Необходимо указать ID графика.");
    const response = await fetch(`${API_BASE_URL}/v2/charts/${chartId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings }),
    });
    return handleResponse(response);
}

/**
 * Удаляет график по ID.
 * @param {string|number} chartId - ID удаляемого графика.
 * @returns {Promise<object>} - Ответ от сервера.
 */
export async function deleteChart(chartId) {
    if (!chartId) throw new Error("Необходимо указать ID графика.");
    const response = await fetch(`${API_BASE_URL}/v2/charts/${chartId}`, {
        method: 'DELETE',
    });
    return handleResponse(response);
}


/**
 * Запрашивает данные (точки) для динамического графика.
 * @param {string} paramsString - Строка URL-параметров (например, 'tableData[0][tableName]=...').
 * @returns {Promise<Array>} - Массив с данными для серий графика.
 */
export async function fetchChartData(paramsString) {
    const response = await fetch(`${API_BASE_URL}/v2/chart-data?${paramsString}`);
    return handleResponse(response);
}
