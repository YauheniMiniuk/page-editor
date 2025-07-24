// --- Централизованная функция для вызова API ---
// Она инкапсулирует общую логику: заголовки, обработку ошибок и ключ API.
async function callOpenRouterAPI(body) {
    const apiKey = process.env.REACT_APP_OPENROUTER_API_KEY;
    if (!apiKey) {
        throw new Error("API ключ OpenRouter не найден. Добавьте REACT_APP_OPENROUTER_API_KEY в ваш .env файл.");
    }

    // --- ШАГ 1: ЛОГИРУЕМ ТО, ЧТО ОТПРАВЛЯЕМ ---
    console.log("⬆️ Отправка на AI:", JSON.stringify(body, null, 2));
    // ---------------------------------------------

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Ошибка API OpenRouter: ${response.status} - ${errorData}`);
    }

    return response.json();
}

/**
 * Генерирует текстовый контент на основе промпта.
 * @param {string} prompt - Запрос пользователя (например, "Напиши заголовок для сайта о путешествиях").
 * @returns {Promise<string>} - Строка с сгенерированным текстом.
 */
export async function generateText(prompt) {
    const body = {
        model: "qwen/qwen3-235b-a22b-07-25:free",
        messages: [
            {
                role: "system",
                content: "Ты — профессиональный копирайтер. Отвечай только сгенерированным текстом, без вводных фраз, приветствий или объяснений."
            },
            {
                role: "user",
                content: prompt
            }
        ]
    };

    const data = await callOpenRouterAPI(body);

    // --- ШАГ 2: ЛОГИРУЕМ ПОЛНЫЙ ОТВЕТ ---
    console.log("⬇️ Получен полный ответ от AI:", JSON.stringify(data, null, 2));
    // --------------------------------------

    // --- ШАГ 3: ДОБАВЛЯЕМ ЗАЩИТНЫЙ КОД ---
    // Проверяем, что ответ имеет ожидаемую структуру
    if (!data.choices || data.choices.length === 0) {
        throw new Error("AI вернул пустой массив 'choices'. Возможно, сработал фильтр контента.");
    }

    const message = data.choices[0].message;
    if (!message) {
        throw new Error("В ответе AI отсутствует объект 'message'.");
    }

    // Некоторые модели могут вернуть пустой content, если нечего сказать или сработал фильтр
    if (message.content === null || message.content === undefined) {
        console.warn("AI вернул 'null' в качестве контента.", "Finish reason:", data.choices[0].finish_reason);
        return ""; // Возвращаем пустую строку, чтобы не было ошибки
    }

    return message.content;
}

/**
 * Отправляет AI полную структуру блока и просит её изменить согласно задаче.
 * @param {object} blockObject - Полный JSON-объект блока.
 * @param {string} userTask - Задача от пользователя (например, "Упрости весь текст").
 * @returns {Promise<object>} - Изменённый JSON-объект блока.
 */
export async function modifyStructureWithAI(blockObject, userTask) {
    // Этот системный промпт - ключ к успеху. Он строго инструктирует модель.
    const systemPrompt = `Ты — AI-редактор веб-компонентов. Ты получишь JSON-объект, представляющий блок и его дочерние элементы.
Твоя задача — выполнить инструкцию пользователя, модифицировав этот JSON.
Правила:
1. Ты ОБЯЗАН вернуть только полный и валидный JSON-объект исходной структуры с твоими изменениями.
2. НЕ меняй ID существующих блоков.
3. НЕ добавляй комментарии, объяснения или markdown. Только чистый JSON.
4. Модифицируй только значения (например, 'content' или 'styles'), но не ключи и не структуру, если об этом не просят.`;

    const body = {
        // Для таких задач лучше подходят более "умные" модели
        model: "qwen/qwen3-235b-a22b-07-25:free",
        response_format: { "type": "json_object" },
        messages: [
            { role: "system", content: systemPrompt },
            {
                role: "user",
                content: `Вот JSON-объект:\n${JSON.stringify(blockObject, null, 2)}\n\nЗадача: "${userTask}"`
            }
        ]
    };

    const data = await callOpenRouterAPI(body);
    const jsonString = data.choices[0].message.content;

    try {
        const cleanedJsonString = jsonString.replace(/```json\n|```/g, '').trim();
        return JSON.parse(cleanedJsonString);
    } catch (error) {
        console.error("AI вернул невалидный JSON:", jsonString, error);
        throw new Error("AI вернул невалидный JSON. Попробуйте изменить запрос.");
    }
}

/**
 * Генерирует структуру блоков в формате JSON по запросу.
 * @param {string} prompt - Запрос пользователя (например, "создай секцию с тремя отзывами").
 * @returns {Promise<object>} - Объект или массив с сгенерированной структурой блоков.
 */
export async function generateLayout(prompt) {
    const systemPrompt = `Ты — ассистент по созданию веб-страниц. Твоя задача — вернуть JSON-массив объектов блоков. Используй только эти типы блоков: "core/container", "core/columns", "core/heading", "core/text", "core/image". Каждый блок должен иметь поля "id", "type", "content", "children". ID должны быть строками. Не добавляй никаких пояснений, комментариев или форматирования markdown. Верни только валидный JSON.`;

    const body = {
        model: "qwen/qwen3-235b-a22b-07-25:free", // Эта модель также неплохо справляется с JSON
        response_format: { "type": "json_object" }, // Просим модель принудительно вернуть JSON
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt }
        ]
    };

    const data = await callOpenRouterAPI(body);
    const jsonString = data.choices[0].message.content;

    try {
        // Модель иногда всё равно оборачивает ответ в markdown ```json ... ```, убираем это.
        const cleanedJsonString = jsonString.replace(/```json\n|```/g, '').trim();
        return JSON.parse(cleanedJsonString);
    } catch (error) {
        console.error("Ошибка парсинга JSON от AI:", error, "Полученная строка:", jsonString);
        throw new Error("AI вернул невалидный JSON. Попробуйте изменить запрос.");
    }
}