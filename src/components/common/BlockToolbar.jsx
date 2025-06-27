
import React, { useState, useLayoutEffect, useRef } from 'react';
import styles from './BlockToolbar.module.css';

const TOOLBAR_MARGIN = 8; // Отступ от блока в пикселях

const BlockToolbar = ({ targetRef, children }) => {
  const toolbarRef = useRef(null);
  // Состояние теперь хранит только позицию. Никакой прозрачности.
  const [style, setStyle] = useState({});

  useLayoutEffect(() => {
    const calculatePosition = () => {
      // Эта проверка все еще важна
      if (!targetRef.current || !toolbarRef.current) {
        return;
      }

      const targetRect = targetRef.current.getBoundingClientRect();
      const toolbarHeight = toolbarRef.current.offsetHeight;

      let topPosition;
      const position = 'fixed'; // Всегда 'fixed' для надежности

      // 1. Логика "Прилипания" к верху экрана
      const isBlockScrolledPast = targetRect.top < TOOLBAR_MARGIN;
      
      if (isBlockScrolledPast) {
        // Блок уходит вверх за экран, прилепляем тулбар к верху
        topPosition = TOOLBAR_MARGIN;
      } else {
        // 2. Логика "Переворота" (сверху/снизу)
        const topPositionAbove = targetRect.top - toolbarHeight - TOOLBAR_MARGIN;
        
        // Теперь простое условие: есть место сверху?
        if (topPositionAbove > 0) {
          topPosition = topPositionAbove;
        } else {
          // Нет места сверху - ставим снизу без вариантов.
          topPosition = targetRect.bottom + TOOLBAR_MARGIN;
        }
      }

      // Центрируем по горизонтали
      const leftPosition = targetRect.left + targetRect.width / 2;

      setStyle({
        position,
        top: `${topPosition}px`,
        left: `${leftPosition}px`,
      });
    };

    // Вызываем расчет сразу и подписываемся на события
    calculatePosition();
    window.addEventListener('scroll', calculatePosition, true);
    window.addEventListener('resize', calculatePosition);

    // Очистка
    return () => {
      window.removeEventListener('scroll', calculatePosition, true);
      window.removeEventListener('resize', calculatePosition);
    };
  }, [targetRef]);

  return (
    <div ref={toolbarRef} className={styles.toolbar} style={style}>
      {children}
    </div>
  );
};

export default BlockToolbar;