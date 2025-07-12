import React, { useMemo, forwardRef } from 'react';
import { motion } from 'framer-motion';
import classNames from 'classnames';

import styles from './VideoBlock.module.css';
import { withBlock } from '../../hocs/withBlock';
import { parseVideoUrl } from '../../utils/videoUtils';

// --- UI ---
import Tabs from '../../ui/Tabs';
import Tab from '../../ui/Tab';
import Input from '../../ui/Input';
import { VideoIcon } from '../../utils/icons';

//================================================================================
// 1. Компонент блока "Видео"
//================================================================================
const VideoBlock = forwardRef(({ block, mode, className, style, ...rest }, ref) => {
    const { props = {} } = block;
    const isEditMode = mode === 'edit';

    const videoInfo = useMemo(() => parseVideoUrl(props.src), [props.src]);

    const getEmbedUrl = () => {
        if (!videoInfo) return '';
        if (videoInfo.provider === 'youtube') {
            return `https://www.youtube.com/embed/${videoInfo.id}`;
        }
        if (videoInfo.provider === 'vimeo') {
            return `https://player.vimeo.com/video/${videoInfo.id}`;
        }
        return '';
    };

    // Если нет видео и мы в режиме редактирования - показываем плейсхолдер
    if (!videoInfo && isEditMode) {
        return (
            <div ref={ref} className={classNames(styles.placeholder, className)} style={style} {...rest}>
                <VideoIcon />
                <span>Вставьте ссылку на видео</span>
            </div>
        );
    }

    // Если ссылка некорректная, ничего не показываем в режиме просмотра
    if (!videoInfo && !isEditMode) {
        return null;
    }

    return (
        <motion.div ref={ref} className={classNames(styles.wrapper, className)} style={{ ...style }}>
            <div className={styles.embedContainer}>
                <iframe
                    src={getEmbedUrl()}
                    title={props.title || 'Видео плеер'}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                ></iframe>
            </div>
        </motion.div>
    );
});

VideoBlock.blockStyles = styles;

//================================================================================
// 2. "Паспорт" блока
//================================================================================
VideoBlock.blockInfo = {
    type: 'core/video',
    label: 'Видео',
    icon: <VideoIcon />,
    isContainer: false,
    description: 'Встраивает видео с YouTube или Vimeo по ссылке.',
    keywords: ['видео', 'ютуб', 'vimeo', 'youtube', 'player', 'плеер'],

    supports: {
        reusable: true,
        html: false,
    },

    defaultData: () => ({
        type: 'core/video',
        props: {
            src: '', // 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
            title: 'Видео плеер',
        },
        styles: {},
        variants: {},
    }),

    example: {
        props: {
            src: 'https://www.youtube.com/watch?v=LXb3EKWsInQ', // Пример видео
        },
    },

    getToolbarItems: () => null,

    getEditor: ({ block, onChange }) => {
        const { props = {} } = block;
        const handlePropsChange = (newProps) => onChange({ props: { ...props, ...newProps } });

        return (
            <Tabs>
                <Tab title="Настройки">
                    <Input
                        label="URL видео (YouTube, Vimeo)"
                        value={props.src || ''}
                        onChange={(e) => handlePropsChange({ src: e.target.value })}
                        placeholder="https://..."
                    />
                    <Input
                        label="Заголовок (для доступности)"
                        value={props.title || ''}
                        onChange={(e) => handlePropsChange({ title: e.target.value })}
                    />
                </Tab>
            </Tabs>
        );
    }
};

export default withBlock(VideoBlock);