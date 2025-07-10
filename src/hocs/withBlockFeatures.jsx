import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { getVariantClasses } from '../utils/styleUtils'; // Наш хелпер из прошлого шага

export const withBlockFeatures = (BlockComponent, styles) => {
  // Наша обёртка возвращает новый компонент
  const WrappedComponent = forwardRef((props, ref) => {
    const { block, className, ...restProps } = props;

    // 1. Централизованная генерация классов из вариантов
    const variantClasses = getVariantClasses(block.variants, styles);

    // 2. Сборка всех классов в одну строку
    const finalClasses = [
      variantClasses,
      className, // Классы от BlockRenderer (например, .selectedWrapper)
    ].filter(Boolean).join(' ');

    // 3. Создание анимированного тега (если нужно)
    // Эта логика может быть внутри самого BlockComponent, так что этот шаг опционален
    // const MotionTag = motion[block.props?.as || 'div'] || motion.div;

    // 4. Рендерим исходный компонент, передавая ему готовые пропсы
    return (
      <BlockComponent
        ref={ref}
        block={block}
        className={finalClasses}
        styles={styles} // Передаем стили, чтобы компонент мог их использовать для внутренних элементов
        {...restProps}
      />
    );
  });

  // Копируем статическую информацию из исходного компонента в новый
  WrappedComponent.blockInfo = BlockComponent.blockInfo;

  return WrappedComponent;
};