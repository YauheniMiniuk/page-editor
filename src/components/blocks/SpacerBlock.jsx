// components/blocks/SpacerBlock.jsx
import React, { forwardRef } from 'react';
import Input from '../../ui/Input';
import { SpacerIcon } from '../../utils/icons';

const SpacerBlock = forwardRef(({ block, onClick, ...restProps }, ref) => {
  return (
    <div
      ref={ref}
      style={{ height: block.styles?.height || '20px' }}
      onClick={onClick}
      {...restProps}
    />
  );
});

SpacerBlock.blockInfo = {
  type: 'core/spacer',
  label: 'Отступ',
  icon: <SpacerIcon />,
  defaultData: {
    type: 'core/spacer',
    styles: { height: '20px' },
  },
  getEditor: ({ block, onChange }) => {
    const { styles = {} } = block;
    const handleStyleChange = (newStyles) => onChange({ styles: { ...styles, ...newStyles } });

    return (
      <div>
        <Input
          label="Высота (в px, rem, %)"
          value={styles.height || ''}
          onChange={(e) => handleStyleChange({ height: e.target.value })}
        />
      </div>
    )
  }
};

export default SpacerBlock;