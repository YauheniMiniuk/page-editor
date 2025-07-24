import React from 'react';
import styles from './Header.module.css';
import { Eye, Code, PanelLeft, PanelRight, Settings, UploadCloud, Undo2, Redo2, Network, Image, Palette, Sparkles, Wand2 } from 'lucide-react'; // Иконки для кнопок
import classNames from 'classnames';
import { useBlockManager } from '../contexts/BlockManagementContext';

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
  canUndo,
  onRedo,
  canRedo
}, ref) => {
  const { actions } = useBlockManager();
  return (
    <header ref={ref} className={styles.header}>
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
              className={classNames(styles.iconButton, { [styles.active]: activeLeftPanel === 'structure' })}
              onClick={() => onToggleLeftPanel('structure')}
              title="Структура"
            >
              <Network size={18} />
            </button>

            <button
              className={styles.iconButton}
              onClick={() => actions.openMediaLibrary()}
              title="Библиотека медиа"
            >
              <Image size={18} />
            </button>

            <button className={styles.iconButton} onClick={actions.openDesignModal} title="Дизайн-система">
              <Palette size={18} />
            </button>

            <button className={styles.iconButton} onClick={actions.openGlobalStylesModal} title="Глобальные стили">
              <Wand2 size={18} /> {/* или Wand2 */}
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
        <div className={styles.modeToggleGroup}> {/* <-- Новая обертка */}
          <button
            className={classNames(styles.modeToggle, { [styles.active]: isEditMode })}
            onClick={isEditMode ? undefined : onToggleMode}
            title="Режим редактирования"
          >
            <Code size={16} />
            <span>Редактор</span>
          </button>
          <button
            className={classNames(styles.modeToggle, { [styles.active]: !isEditMode })}
            onClick={!isEditMode ? undefined : onToggleMode}
            title="Режим просмотра"
          >
            <Eye size={16} />
            <span>Просмотр</span>
          </button>
        </div>
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
