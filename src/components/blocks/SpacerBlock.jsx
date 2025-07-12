import React, { forwardRef } from 'react';
import { Resizable } from 're-resizable';

import styles from './SpacerBlock.module.css';
import { withBlock } from '../../hocs/withBlock';

// --- UI ---
import CustomUnitInput from '../../ui/CustomUnitInput';
import { SpacerIcon } from '../../utils/icons';

//================================================================================
// 1. Компонент блока "Отступ"
//================================================================================
const SpacerBlock = forwardRef(({ block, mode, className, style, actions, ...rest }, ref) => {
  const isEditMode = mode === 'edit';
  const height = block.styles?.height || '20px';

  const handleResizeStop = (e, direction, refToElement, delta) => {
    // Обновляем высоту в данных блока после изменения размера
    const newHeight = parseInt(refToElement.style.height, 10);
    actions.update(block.id, { styles: { height: `${newHeight}px` } });
  };

  // В режиме редактирования показываем блок с возможностью изменения размера
  if (isEditMode) {
    return (
      <div ref={ref} className={styles.wrapper} {...rest}>
        <Resizable
          className={styles.resizable}
          style={{ ...style }}
          size={{ width: '100%', height }}
          onResizeStop={handleResizeStop}
          // Включаем только нижний маркер для изменения размера по вертикали
          enable={{ top: false, right: false, bottom: true, left: false, topRight: false, bottomRight: false, bottomLeft: false, topLeft: false }}
          handleComponent={{
            bottom: <div className={styles.resizerHandle} />
          }}
        >
          <span className={styles.heightLabel}>{height}</span>
        </Resizable>
      </div>
    );
  }

  // В режиме просмотра это просто невидимый блок нужной высоты
  return (
    <div ref={ref} style={{ height, ...style }} {...rest} />
  );
});

SpacerBlock.blockStyles = styles;

//================================================================================
// 2. "Паспорт" блока
//================================================================================
SpacerBlock.blockInfo = {
  type: 'core/spacer',
  label: 'Отступ',
  icon: <SpacerIcon />,
  isContainer: false,

  description: 'Добавляет пустое пространство с настраиваемой высотой.',
  keywords: ['пробел', 'пустота', 'разделитель', 'space', 'divider'],

  parent: null,
  allowedBlocks: [],

  supports: {
    reusable: true,
    html: false,
    anchor: false,
  },

  transforms: {}, // Трансформировать отступ некуда

  example: {
    styles: { height: '50px' }
  },

  defaultData: () => ({
    type: 'core/spacer',
    styles: { height: '20px' },
  }),

  getEditor: ({ block, onChange }) => {
    const { styles = {} } = block;
    const handleStyleChange = (newStyles) => onChange({ styles: { ...styles, ...newStyles } });

    return (
      <div>
        <h4>Высота отступа</h4>
        <CustomUnitInput
          value={styles.height || '20px'}
          onChange={(val) => handleStyleChange({ height: val })}
          units={['px', 'rem', 'em', '%', 'vh']}
        />
      </div>
    )
  }
};

export default withBlock(SpacerBlock);