import React from 'react';
import styles from './Header.module.css';
import { Eye, Code, PanelLeft, PanelRight, Settings, UploadCloud, Undo2, Redo2 } from 'lucide-react'; // Иконки для кнопок

const Header = ({
  isEditMode,
  onToggleMode,
  onSave,
  pageTitle = "Редактор страниц",
  activeLeftPanel,
  onToggleLeftPanel,
  isPropertiesVisible,
  onTogglePropertiesPanel,
  pageStatus,
  onPublish,
  isSaveDisabled,
  onUndo,
  onRedo,
  canUndo,
  canRedo
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
        {isEditMode && (
          <>
            <button className={styles.iconButton} title="Отменить (Ctrl+Z)" onClick={onUndo} disabled={!canUndo}>
              <Undo2 size={18} />
            </button>
            <button className={styles.iconButton} title="Повторить (Ctrl+Y)" onClick={onRedo} disabled={!canRedo}>
              <Redo2 size={18} />
            </button>
            <div className={styles.separator} />
          </>
        )}
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

            {/* --- НОВЫЙ БЛОК ПУБЛИКАЦИИ --- */}
            {!pageStatus.isNewPage && (
              pageStatus.isLive ? (
                <div className={styles.statusIndicator}>
                  <span className={styles.liveDot}></span>
                  Опубликовано
                </div>
              ) : (
                <button onClick={onPublish} className={styles.publishButton}>
                  <UploadCloud size={16} />
                  <span>Опубликовать</span>
                </button>
              )
            )}
            {/* --- КОНЕЦ НОВОГО БЛОКА --- */}

            <button onClick={onSave} className={styles.saveButton} disabled={isSaveDisabled}>
              Сохранить
            </button>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;
