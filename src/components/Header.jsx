import React from 'react';
import styles from './Header.module.css';
import { Eye, Code, PanelLeft, PanelRight, Settings } from 'lucide-react'; // Иконки для кнопок

const Header = ({
  isEditMode,
  onToggleMode,
  onSave,
  pageTitle = "Редактор страниц",
  activeLeftPanel,
  onToggleLeftPanel,
  isPropertiesVisible,
  onTogglePropertiesPanel
}) => {
  return (
    <header className={styles.header}>
      {/* ЛЕВАЯ СЕКЦИЯ: Заголовок и кнопки для левых панелей */}
      <div className={styles.leftSection}>
        <h1 className={styles.pageTitle}>{pageTitle}</h1>
        {isEditMode && (
          <>
            <div className={styles.separator}></div>
            <button
              className={`${styles.iconButton} ${activeLeftPanel === 'elements' ? styles.active : ''}`}
              onClick={() => onToggleLeftPanel('elements')}
              title="Панель элементов"
            >
              <PanelLeft size={18} />
            </button>
            <button
              className={`${styles.iconButton} ${activeLeftPanel === 'structure' ? styles.active : ''}`}
              onClick={() => onToggleLeftPanel('structure')}
              title="Структура"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 6h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-3"></path><path d="M8 6H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"></path><path d="M12 4v16"></path></svg>
            </button>
          </>
        )}
      </div>

      {/* ЦЕНТРАЛЬНАЯ СЕКЦИЯ: Переключатель режима */}
      <div className={styles.centerSection}>
        <button
          className={`${styles.modeToggle} ${isEditMode ? styles.active : ''}`}
          onClick={onToggleMode}
          title="Перейти в режим редактирования"
        >
          <Code size={16} />
          <span>Редактор</span>
        </button>
        <button
          className={`${styles.modeToggle} ${!isEditMode ? styles.active : ''}`}
          onClick={onToggleMode}
          title="Перейти в режим просмотра"
        >
          <Eye size={16} />
          <span>Просмотр</span>
        </button>
      </div>

      {/* ПРАВАЯ СЕКЦИЯ: Обертка всегда на месте, контент условный */}
      <div className={styles.rightSection}>
        {isEditMode && (
          <>
            <button
              className={`${styles.iconButton} ${isPropertiesVisible ? styles.active : ''}`}
              onClick={onTogglePropertiesPanel}
              title="Свойства"
            >
              <Settings size={18} />
            </button>
            <div className={styles.separator}></div>
            <button onClick={onSave} className={styles.saveButton}>Сохранить</button>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;
