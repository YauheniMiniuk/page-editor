export const setCursorPosition = (element, position) => {
    if (!element) {
        console.error("❌ setCursorPosition: Элемент не передан (null).");
        return;
    }
    console.log(`🎯 setCursorPosition: Пытаюсь установить курсор на элемент:`, element);

    element.focus();
    const range = document.createRange();
    const sel = window.getSelection();
    if (position === 'end' && element.hasChildNodes()) {
        range.selectNodeContents(element);
        range.collapse(false);
    } else {
        range.setStart(element, 0);
        range.collapse(true);
    }
    sel.removeAllRanges();
    sel.addRange(range);
    console.log("✅ setCursorPosition: Курсор успешно установлен.");
};