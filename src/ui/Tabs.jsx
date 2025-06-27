import React, { useState } from 'react';
import styles from './Tabs.module.css';

const Tabs = ({ children }) => {
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  // FIX: Всегда работаем с children как с массивом. Это исправляет баг "одного ребенка".
  const tabsArray = React.Children.toArray(children);

  return (
    <div className={styles.tabs}>
      <div className={styles.tabHeaders}>
        {/* REFACTOR: Итерируемся по надежному массиву tabsArray */}
        {tabsArray.map((tab, index) => {
          // REFACTOR: Более чистый и безопасный способ задать классы
          const buttonClasses = [
            styles.tabButton,
            index === activeTabIndex ? styles.active : ''
          ].filter(Boolean).join(' ');

          return (
            <button
              key={index}
              className={buttonClasses}
              onClick={() => setActiveTabIndex(index)}
            >
              {tab.props.title}
            </button>
          );
        })}
      </div>
      <div className={styles.tabContent}>
        {/* FIX: Выбираем активный таб из нашего надежного массива */}
        {tabsArray[activeTabIndex]}
      </div>
    </div>
  );
};

export default Tabs;