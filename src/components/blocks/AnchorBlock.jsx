import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import classNames from 'classnames';

import styles from './AnchorBlock.module.css';
import { withBlock } from '../../hocs/withBlock';

// --- UI ---
import Input from '../../ui/Input';
import { AnchorIcon } from '../../utils/icons';
import { nanoid } from 'nanoid';

//================================================================================
// 1. Компонент блока "Якорь"
//================================================================================
const AnchorBlock = forwardRef(({ block, mode, className, style, ...rest }, ref) => {
    const { props = {} } = block;
    const isEditMode = mode === 'edit';

    // В режиме просмотра блок не рендерит ничего - он невидим
    if (!isEditMode) {
        // Рендерим пустой div с id, чтобы ссылка работала
        return <div id={props.anchorId} />;
    }

    // В режиме редактирования показываем заметный плейсхолдер
    return (
        <motion.div
            ref={ref}
            className={classNames(styles.wrapper, className)}
            style={style}
            {...rest}
        >
            <AnchorIcon />
            <span>Якорь: #{props.anchorId || '...'}</span>
        </motion.div>
    );
});

AnchorBlock.blockStyles = styles;

//================================================================================
// 2. "Паспорт" блока
//================================================================================
AnchorBlock.blockInfo = {
    type: 'core/anchor',
    label: 'Якорь',
    icon: <AnchorIcon />,
    isContainer: false,
    description: 'Создает невидимую точку на странице для навигации по ссылкам.',
    keywords: ['якорь', 'ссылка', 'id', 'anchor', 'jump'],

    supports: {
        reusable: false,
        html: false,
    },

    defaultData: () => ({
        type: 'core/anchor',
        props: {
            // Генерируем уникальный ID по умолчанию
            anchorId: `section-${nanoid(6)}`,
        },
    }),

    getToolbarItems: () => null,

    getEditor: ({ block, onChange }) => {
        const { props = {} } = block;

        const handleIdChange = (e) => {
            // Очищаем ID от лишних символов
            const newId = e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '');
            onChange({ props: { ...props, anchorId: newId } });
        };

        return (
            <div>
                <h4>ID якоря</h4>
                <Input
                    label="Уникальный идентификатор"
                    value={props.anchorId || ''}
                    onChange={handleIdChange}
                    prefix="#"
                />
                <p className={styles.editorHelp}>Используйте только латинские буквы, цифры, тире и подчеркивания. Ссылка на этот якорь будет выглядеть так: `#`{props.anchorId}</p>
            </div>
        );
    }
};

export default withBlock(AnchorBlock);