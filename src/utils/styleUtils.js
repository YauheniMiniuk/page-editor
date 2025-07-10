export const getVariantClasses = (variants = {}, styles = {}) => {
  return Object.entries(variants)
    .map(([key, value]) => {
      const className = `variant-${key}-${value}`;
      // Возвращаем реальное, хешированное имя класса из CSS-модуля
      if (value && styles[className]) {
        return styles[className];
      }
      return null;
    })
    .filter(Boolean)
    .join(' ');
};

export const calculateIndicatorStyle = (indicatorInfo) => {
        if (!indicatorInfo) return {};

        const { parentId, position } = indicatorInfo;
        const overNode = document.getElementById(parentId);
        if (!overNode) return {};
        
        const overRect = overNode.getBoundingClientRect();
        
        // Учитываем прокрутку страницы
        const top = overRect.top + window.scrollY;
        const left = overRect.left + window.scrollX;
        const height = 2; // Высота нашей линии-индикатора

        // Вычисляем позицию линии
        let indicatorTop;
        if (position === 'top') {
            indicatorTop = top - height / 2;
        } else if (position === 'bottom') {
            indicatorTop = top + overRect.height - height / 2;
        } else { // 'inner'
            // Для 'inner' можно просто вернуть пустой объект, так как мы подсвечиваем фон
            return {}; 
        }

        return {
            position: 'absolute',
            top: `${indicatorTop}px`,
            left: `${left}px`,
            width: `${overRect.width}px`,
            height: `${height}px`,
            backgroundColor: 'var(--accent-primary)',
            zIndex: 1000,
        };
    };