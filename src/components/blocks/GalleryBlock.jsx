import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import classNames from 'classnames';
import { nanoid } from 'nanoid';

import styles from './GalleryBlock.module.css';
import { withBlock } from '../../hocs/withBlock';

// --- UI ---
import Tabs from '../../ui/Tabs';
import Tab from '../../ui/Tab';
import Input from '../../ui/Input';
import Select from '../../ui/Select';
import ToolbarButton from '../../ui/ToolbarButton';
import { GalleryIcon, PlusIcon, TrashIcon } from '../../utils/icons';
import Checkbox from '../../ui/Checkbox';

//================================================================================
// 1. Дочерний компонент для ОДНОГО изображения в галерее
//================================================================================
const GalleryImageBlock = forwardRef(({ block, mode, className, style, actions, ...rest }, ref) => {
    const { props = {} } = block;
    const isEditMode = mode === 'edit';

    const imageTag = <img src={props.src || 'https://via.placeholder.com/300x300?text=Image'} alt={props.alt || ''} />;

    return (
        // ИСПРАВЛЕНИЕ 1: Добавляем {...rest}, чтобы блок стал кликабельным
        <figure ref={ref} className={classNames(styles.galleryItem, className)} style={style} {...rest}>
            {/* ИСПРАВЛЕНИЕ 2: В режиме просмотра оборачиваем в ссылку, если она есть */}
            {!isEditMode && props.href ? (
                <a href={props.href} target={props.target} rel={props.target === '_blank' ? 'noopener noreferrer' : null}>
                    {imageTag}
                </a>
            ) : (
                imageTag
            )}

            {isEditMode && (
                <div className={styles.itemOverlay}>
                    <ToolbarButton title="Удалить" onClick={(e) => { e.stopPropagation(); actions.delete(block.id); }} small>
                        <TrashIcon />
                    </ToolbarButton>
                </div>
            )}
        </figure>
    );
});

//================================================================================
// 2. Родительский компонент-обертка для Галереи
//================================================================================
const GalleryBlock = forwardRef(({ block, children, className, style, ...rest }, ref) => {
    const { variants = {}, styles: blockStyles = {} } = block;

    const finalStyles = {
        ...blockStyles,
        ...style,
        '--gallery-columns': variants.columns || 3,
        '--gallery-gap': variants.gap || '1rem',
    };

    return (
        <motion.div ref={ref} className={classNames(styles.galleryWrapper, className)} style={finalStyles} {...rest}>
            {children}
        </motion.div>
    );
});

//================================================================================
// 3. Конфигурация для редактора
//================================================================================

//================================================================================
// 3. Конфигурация для редактора
//================================================================================

// --- Конфиг для ОДНОГО Изображения ---
GalleryImageBlock.blockInfo = {
    type: 'core/gallery-image',
    label: 'Изображение галереи',
    isContainer: false,
    parent: ['core/gallery'],
    supports: { inserter: false, reusable: false },
    defaultData: () => ({
        type: 'core/gallery-image',
        // ИСПРАВЛЕНИЕ 3: Добавляем поля для ссылки в данные по умолчанию
        props: { src: '', alt: '', href: '', target: '' },
    }),
    // ИСПРАВЛЕНИЕ 4: Добавляем настройки в боковую панель для каждого изображения
    getEditor: ({ block, onChange }) => {
        const { props = {} } = block;
        const handlePropsChange = (newProps) => onChange({ props: { ...props, ...newProps } });

        return (
            <Tabs>
                <Tab title="Настройки">
                    <h4>Источник</h4>
                    <Input label="URL изображения" value={props.src || ''} onChange={(e) => handlePropsChange({ src: e.target.value })} />
                    <Input label="Alt текст" value={props.alt || ''} onChange={(e) => handlePropsChange({ alt: e.target.value })} />
                    <hr />
                    <h4>Ссылка</h4>
                    <Input label="URL ссылки" placeholder="https://..." value={props.href || ''} onChange={(e) => handlePropsChange({ href: e.target.value })} />
                    <Checkbox label="Открывать в новой вкладке" checked={props.target === '_blank'} onChange={(e) => handlePropsChange({ target: e.target.checked ? '_blank' : '' })} />
                </Tab>
            </Tabs>
        );
    }
};

// --- Конфиг для Галереи ---
GalleryBlock.blockInfo = {
    type: 'core/gallery',
    label: 'Галерея',
    icon: <GalleryIcon />,
    isContainer: true,
    description: 'Отображает несколько изображений в виде сетки.',
    keywords: ['галерея', 'изображения', 'фотографии', 'сетка', 'grid'],

    parent: null,
    allowedBlocks: ['core/gallery-image'],

    supports: { reusable: true, anchor: true },

    defaultData: () => ({
        type: 'core/gallery',
        variants: { columns: 3, gap: '1rem' },
        children: [
            { id: nanoid(), ...GalleryImageBlock.blockInfo.defaultData(), props: { src: 'https://via.placeholder.com/300x300?text=1' } },
            { id: nanoid(), ...GalleryImageBlock.blockInfo.defaultData(), props: { src: 'https://via.placeholder.com/300x300?text=2' } },
            { id: nanoid(), ...GalleryImageBlock.blockInfo.defaultData(), props: { src: 'https://via.placeholder.com/300x300?text=3' } },
        ],
    }),

    getToolbarItems: ({ block, actions }) => {
        const handleAddImage = () => {
            const src = prompt("Введите URL нового изображения:", "https://via.placeholder.com/300x300?text=New");
            if (src) {
                const newImage = { id: nanoid(), ...GalleryImageBlock.blockInfo.defaultData(), props: { src } };
                actions.update(block.id, { children: [...block.children, newImage] });
            }
        };
        return (
            <ToolbarButton title="Добавить изображение" onClick={handleAddImage}>
                <PlusIcon />
            </ToolbarButton>
        );
    },

    getEditor: ({ block, onChange }, helpers) => {
        const { variants = {} } = block;

        return (
            <Tabs>
                <Tab title="Настройки">
                    <Select
                        label="Колонки"
                        value={variants.columns || 3}
                        options={[2, 3, 4, 5, 6].map(n => ({ value: n, label: `${n} колонки` }))}
                        onChange={(val) => helpers.updateVariant('columns', Number(val))}
                    />
                    <Input
                        label="Отступ между изображениями"
                        value={variants.gap || '1rem'}
                        onChange={(e) => helpers.updateVariant('gap', e.target.value)}
                    />
                </Tab>
            </Tabs>
        );
    },
};

//================================================================================
// 4. Экспорты
//================================================================================
export const GalleryBlockWrapped = withBlock(GalleryBlock);
export const GalleryImageBlockWrapped = withBlock(GalleryImageBlock);

export default GalleryBlockWrapped;