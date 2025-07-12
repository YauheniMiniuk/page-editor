import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import classNames from 'classnames';

import styles from './CodeBlock.module.css';
import { withBlock } from '../../hocs/withBlock';

// --- UI ---
import { CodeIcon } from '../../utils/icons';

//================================================================================
// 1. Компонент блока "Код"
//================================================================================
const CodeBlock = forwardRef(({ block, mode, className, style, actions, ...rest }, ref) => {
    const { content = '' } = block;
    const isEditMode = mode === 'edit';

    const handleBlur = (e) => {
        if (isEditMode && actions) {
            // ВАЖНО: для <pre> используем textContent, чтобы сохранить переносы строк как \n
            const newContent = e.currentTarget.textContent;
            if (newContent !== content) {
                actions.update(block.id, { content: newContent });
            }
        }
    };

    return (
        // Тег <pre> сохраняет все пробелы и переносы строк
        <motion.pre
            ref={ref}
            className={classNames(styles.pre, className)}
            style={{ ...block.styles, ...style }}
            {...rest}
        >
            {/* Тег <code> семантически правильный для кода */}
            <code
                className={styles.code}
                contentEditable={isEditMode}
                suppressContentEditableWarning={true}
                onBlur={handleBlur}
            >
                {content}
            </code>
        </motion.pre>
    );
});

CodeBlock.blockStyles = styles;

//================================================================================
// 2. "Паспорт" блока
//================================================================================
CodeBlock.blockInfo = {
    type: 'core/code',
    label: 'Код',
    icon: <CodeIcon />,
    description: 'Добавляет блок для отображения форматированного кода.',
    keywords: ['код', 'программирование', 'сниппет', 'code', 'snippet'],

    parent: null,
    isContainer: false,

    supports: {
        reusable: true,
        html: false, // Код должен быть чистым текстом
    },

    defaultData: () => ({
        type: 'core/code',
        content: `// Ваш код здесь...\nfunction sayHello() {\n  console.log("Hello, World!");\n}`,
        props: {},
        styles: {},
        variants: {},
    }),

    // У этого блока нет сложных настроек
    getToolbarItems: () => null,
    getEditor: () => <p>Для этого блока нет дополнительных настроек.</p>
};

export default withBlock(CodeBlock);