import React, { useMemo } from 'react';
import ReactDOM from 'react-dom';

// Функция для преобразования camelCase в kebab-case (e.g., backgroundColor -> background-color)
const toKebabCase = (str) => str.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);

// Функция для генерации CSS-строки из объекта стилей
const generateCssFromObject = (styleObject) => {
  if (!styleObject) return '';
  return Object.entries(styleObject)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `  ${toKebabCase(key)}: ${value};`)
    .join('\n');
};

export const withDynamicStyles = (WrappedComponent) => {
  const StyledComponent = (props) => {
    const { block } = props;

    const dynamicStyle = useMemo(() => {
      // Генерируем CSS только если есть какие-то стили
      const defaultStyles = generateCssFromObject(block.styles?.default);
      const hoverStyles = generateCssFromObject(block.styles?.hover);

      // Собираем итоговый CSS
      let css = '';
      if (defaultStyles) {
        css += `[data-block-id="${block.id}"] {\n${defaultStyles}\n}\n`;
      }
      if (hoverStyles) {
        css += `[data-block-id="${block.id}"]:hover {\n${hoverStyles}\n}\n`;
      }
      return css;

    }, [block.id, block.styles]);

    return (
      <>
        {/* Внедряем наши стили в <head> через портал */}
        {dynamicStyle && ReactDOM.createPortal(
          <style>{dynamicStyle}</style>,
          document.head
        )}
        <WrappedComponent {...props} />
      </>
    );
  };
  return StyledComponent;
};