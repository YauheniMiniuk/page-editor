const DropIndicator = ({ rect, isOverlay }) => {
  // Явно задаем все стили, чтобы исключить влияние CSS-файлов
  const style = {
    position: 'fixed',
    zIndex: 10000,
    pointerEvents: 'none',
    transition: 'all 0.1s ease',

    // Геометрия из `rect`
    top: `${rect.top}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
  };

  // Стили для разных типов индикатора
  if (isOverlay) {
    style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
    style.border = '2px dashed #3b82f6';
    style.borderRadius = '4px';
  } else {
    style.backgroundColor = '#3b82f6';
    style.borderRadius = '2px';
  }

  return <div style={style} />;
};

export default DropIndicator;