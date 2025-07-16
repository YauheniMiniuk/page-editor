import React, { forwardRef } from 'react';
import classNames from 'classnames';
import styles from './ColumnsBlock.module.css'; // Используем те же стили

// HOC и UI
import { withBlock } from '../../hocs/withBlock';
import Tabs from '../../ui/Tabs';
import Tab from '../../ui/Tab';
import Select from '../../ui/Select';
import CustomUnitInput from '../../ui/CustomUnitInput';
import ColorPicker from '../../ui/ColorPicker';
import Input from '../../ui/Input';

// --- Компонент ---
const ColumnBlock = forwardRef(({ block, children, mode, className, style, ...rest }, ref) => {
    const isEditMode = mode === 'edit';
    const hasChildren = React.Children.count(children) > 0;

    // 🔥 Классы для выравнивания контента внутри колонки
    const finalClasses = classNames(
        styles.column,
        className,
        {
            [styles.isEmpty]: isEditMode && !hasChildren,
            [styles[`variant-justifyContent-${block.variants?.justifyContent}`]]: block.variants?.justifyContent
        }
    );
    const finalStyles = { ...block.styles, ...style };

    return (
        <div ref={ref} className={finalClasses} style={finalStyles} {...rest}>
            {hasChildren ? children : (isEditMode && <div className={styles.emptyDropZone}>Блок сюда</div>)}
        </div>
    );
});

// --- Данные по умолчанию (экспортируем для родителя) ---
export const defaultData = () => ({
    type: 'core/column',
    children: [],
    props: {},
    styles: { flex: '1 1 0%' },
    variants: { justifyContent: 'flex-start' },
});

// --- Конфигурация ---
ColumnBlock.blockInfo = {
    type: 'core/column',
    label: 'Колонка',
    isContainer: true,
    parent: ['core/columns'],
    supports: { inserter: false, reusable: false },
    layoutDirection: 'column',
    defaultData: defaultData,

    getEditor: ({ block, onChange }) => {
        const { styles = {}, variants = {} } = block;
        const handleStyleChange = (newStyles) => onChange({ styles: { ...styles, ...newStyles } });
        const handleVariantChange = (name, value) => onChange({ variants: { ...variants, [name]: value } });

        return (
            <Tabs>
                <Tab title="Компоновка">
                    <h4>Размер</h4>
                    <CustomUnitInput label="Ширина (width)" value={styles.width || ''} onChange={(val) => handleStyleChange({ width: val, flex: val ? `0 0 ${val}` : '1 1 0%' })} />
                    <Select
                        label="Вертикальное"
                        value={variants.justifyContent || 'flex-start'}
                        options={[
                            { value: 'flex-start', label: 'По верху' },
                            { value: 'center', label: 'По центру' },
                            { value: 'flex-end', label: 'По низу' },
                            { value: 'space-between', label: 'Равномерно (между)' },
                        ]}
                        onChange={(val) => handleVariantChange('justifyContent', val)}
                    />
                </Tab>
                <Tab title="Стили">
                    <h4>Фон и Границы</h4>
                    <ColorPicker label="Цвет фона" value={styles.backgroundColor || ''} onChange={(color) => handleStyleChange({ backgroundColor: color })} />
                    <CustomUnitInput label="Скругление" value={styles.borderRadius || ''} onChange={(val) => handleStyleChange({ borderRadius: val })} />
                    <Input label="Граница" placeholder="1px solid #ccc" value={styles.border || ''} onChange={(e) => handleStyleChange({ border: e.target.value })} />
                    <hr />
                    <h4>Отступы</h4>
                    <CustomUnitInput label="Внутренние (padding)" value={styles.padding || ''} onChange={(val) => handleStyleChange({ padding: val })} />
                </Tab>
            </Tabs>
        );
    }
};

export default withBlock(ColumnBlock);