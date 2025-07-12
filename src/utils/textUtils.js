/**
 * Находит ближайший родительский элемент с указанным тегом.
 * @param {Node} node - Начальный узел DOM.
 * @param {string} tagName - Имя тега для поиска (например, 'b', 'i').
 * @param {Element} boundary - Элемент, на котором нужно остановить поиск.
 * @returns {Element|null} - Найденный элемент или null.
 */
const getClosestParentTag = (node, tagName, boundary) => {
    while (node && node !== boundary && node.nodeType === Node.ELEMENT_NODE) {
        if (node.tagName.toLowerCase() === tagName) {
            return node;
        }
        node = node.parentNode;
    }
    return null;
};

/**
 * Итерирует по всем текстовым узлам в диапазоне и применяет колбэк.
 * Возвращает true, если колбэк возвращает true для всех узлов, иначе false.
 * @param {Range} range - Диапазон выделения.
 * @param {function(Node): boolean} predicate - Функция-предикат для проверки текстового узла.
 * @returns {boolean}
 */
const forEachTextNodeInRange = (range, predicate) => {
    // --- РЕШЕНИЕ: Создаем TreeWalker из `document`, а не из `range` ---
    const iterator = document.createTreeWalker(
        range.commonAncestorContainer, // Начинаем обход с ближайшего общего родителя
        NodeFilter.SHOW_TEXT,
        {
            acceptNode: function (node) {
                // Твоя логика фильтрации - она абсолютно правильная!
                if (range.intersectsNode(node)) {
                    return NodeFilter.FILTER_ACCEPT;
                }
                return NodeFilter.FILTER_SKIP;
            }
        },
    );

    let node = iterator.nextNode();
    let allMatch = true;
    while (node) {
        if (!predicate(node)) {
            allMatch = false;
            break; // Прерываем, если нашли несоответствие
        }
        node = iterator.nextNode();
    }
    return allMatch;
};


/**
 * Применяет или убирает стиль для выделенного текста или всего блока.
 * @param {string} tagName - Имя тега ('b', 'i', 'u').
 * @param {HTMLElement} blockElement - Элемент блока, к которому применяется форматирование.
 */
export const toggleStyle = (tagName, blockElement) => {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);

    const isSelectionCollapsed = selection.isCollapsed;

    // Убедимся, что выделение находится внутри или хотя бы затрагивает blockElement
    const isSelectionWithinBlock = blockElement.contains(selection.anchorNode) ||
        blockElement.contains(selection.focusNode) ||
        blockElement.contains(range.commonAncestorContainer);

    // Если выделение свернуто ИЛИ выделение не находится в пределах текущего блока,
    // обрабатываем весь блок.
    const shouldProcessEntireBlock = isSelectionCollapsed || !isSelectionWithinBlock;


    if (shouldProcessEntireBlock) {
        // Логика для форматирования всего блока
        const currentContent = blockElement.innerHTML;
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = currentContent;

        const isCurrentlyWrapped = tempDiv.children.length === 1 && tempDiv.children[0].tagName.toLowerCase() === tagName;

        if (isCurrentlyWrapped) {
            blockElement.innerHTML = tempDiv.children[0].innerHTML;
        } else {
            blockElement.innerHTML = `<${tagName}>${currentContent}</${tagName}>`;
        }

        const newRange = document.createRange();
        newRange.selectNodeContents(blockElement);
        newRange.collapse(false); // Свернуть в конец
        selection.removeAllRanges();
        selection.addRange(newRange);

    } else {
        // Логика для форматирования выделенного текста
        // Проверяем, весь ли выделенный диапазон уже имеет стиль
        let allSelectedTextHasStyle = true;
        let referenceTag = null; // Будем хранить ссылку на первый найденный тег для сравнения

        // Итерируем по всем текстовым узлам в выделении
        forEachTextNodeInRange(range, (node) => {
            const parentTag = getClosestParentTag(node, tagName, blockElement);
            if (!parentTag) {
                // Если хотя бы один текстовый узел не имеет стиля, то не весь диапазон стилизован
                allSelectedTextHasStyle = false;
                return false; // Прекращаем итерацию
            }
            if (!referenceTag) {
                referenceTag = parentTag; // Запоминаем первый найденный тег
            } else if (referenceTag !== parentTag) {
                // Если текстовые узлы находятся в разных тегах одного типа,
                // то это не "монолитное" выделение (например, <b>часть1</b> <i>часть2</i>)
                // или пользователь выделил поверх нескольких тегов.
                allSelectedTextHasStyle = false;
                return false; // Прекращаем итерацию
            }
            return true;
        });

        // Теперь принимаем решение
        if (allSelectedTextHasStyle && referenceTag) {
            // Если весь выделенный текст уже имеет стиль, и он находится внутри одного тега, то снимаем стиль
            const parent = referenceTag.parentNode;
            const fragment = document.createDocumentFragment();

            while (referenceTag.firstChild) {
                fragment.appendChild(referenceTag.firstChild);
            }
            parent.replaceChild(fragment, referenceTag);
            parent.normalize(); // "Склеиваем" соседние текстовые узлы

            // Восстанавливаем выделение в исходном диапазоне
            selection.removeAllRanges();
            selection.addRange(range);

        } else {
            // Иначе (стиля нет, или он не монолитен, или выделение пустое), применяем стиль
            if (range.collapsed) return; // Не применяем стиль к пустому выделению, если оно не весь блок

            const newTag = document.createElement(tagName);
            newTag.appendChild(range.extractContents());
            range.insertNode(newTag);

            // Восстанавливаем выделение
            selection.removeAllRanges();
            selection.addRange(range);
        }
    }
};