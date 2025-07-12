import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import classNames from 'classnames';

import styles from './DividerBlock.module.css';
import { withBlock } from '../../hocs/withBlock';

// --- UI ---
import Tabs from '../../ui/Tabs';
import Tab from '../../ui/Tab';
import ColorPicker from '../../ui/ColorPicker';
import CustomUnitInput from '../../ui/CustomUnitInput';
import Select from '../../ui/Select';
import { DividerIcon } from '../../utils/icons';

//================================================================================
// 1. Компонент блока "Разделитель"
//================================================================================
const DividerBlock = forwardRef(({ block, className, style, ...rest }, ref) => {
    // Этот блок просто рендерит <hr> со стилями из данных блока
    return (
        <motion.hr
            ref={ref}
            className={classNames(styles.divider, className)}
            style={{ ...block.styles, ...style }}
            {...rest}
        />
    );
});

DividerBlock.blockStyles = styles;

//================================================================================
// 2. "Паспорт" блока
//================================================================================
DividerBlock.blockInfo = {
    type: 'core/divider',
    label: 'Разделитель',
    icon: <DividerIcon />,
    isContainer: false,
    description: 'Добавляет горизонтальную линию для визуального разделения контента.',
    keywords: ['разделитель', 'линия', 'hr', 'divider', 'separator'],

    supports: {
        reusable: true,
        html: false,
    },

    defaultData: () => ({
        type: 'core/divider',
        styles: {
            borderTopWidth: '2px',
            borderTopStyle: 'solid',
            borderColor: '#e5e7eb', // Светло-серый по умолчанию
            marginTop: '1.5rem',
            marginBottom: '1.5rem',
        },
    }),

    getToolbarItems: () => null,

    getEditor: ({ block, onChange }) => {
        const { styles = {} } = block;
        const handleStyleChange = (newStyles) => onChange({ styles: { ...styles, ...newStyles } });

        const styleOptions = [
            { value: 'solid', label: 'Сплошная' },
            { value: 'dashed', label: 'Пунктирная' },
            { value: 'dotted', label: 'Точечная' },
        ];

        return (
            <Tabs>
                <Tab title="Стили">
                    <h4>Оформление</h4>
                    <Select
                        label="Стиль линии"
                        options={styleOptions}
                        value={styles.borderTopStyle || 'solid'}
                        onChange={(val) => handleStyleChange({ borderTopStyle: val })}
                    />
                    <ColorPicker
                        label="Цвет линии"
                        value={styles.borderColor || ''}
                        onChange={(color) => handleStyleChange({ borderColor: color })}
                    />
                    <CustomUnitInput
                        label="Толщина"
                        value={styles.borderTopWidth || ''}
                        onChange={(val) => handleStyleChange({ borderTopWidth: val })}
                        units={['px']}
                    />
                    <hr />
                    <h4>Отступы</h4>
                    <CustomUnitInput
                        label="Отступ сверху"
                        value={styles.marginTop || ''}
                        onChange={(val) => handleStyleChange({ marginTop: val })}
                    />
                    <CustomUnitInput
                        label="Отступ снизу"
                        value={styles.marginBottom || ''}
                        onChange={(val) => handleStyleChange({ marginBottom: val })}
                    />
                </Tab>
            </Tabs>
        );
    }
};

export default withBlock(DividerBlock);