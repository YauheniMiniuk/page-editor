import React, { forwardRef, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import classNames from 'classnames';
import { nanoid } from 'nanoid';
// Импортируем Swiper
import Swiper from 'swiper';
import { Navigation, Pagination } from 'swiper/modules';
// Импортируем стили Swiper
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

import styles from './SliderBlock.module.css';
import { withBlock } from '../../hocs/withBlock';

// --- UI ---
import { SliderIcon, PlusIcon, ContentWidthIcon, WideWidthIcon, FullWidthIcon } from '../../utils/icons';
import ToolbarButton from '../../ui/ToolbarButton';
import Tabs from '../../ui/Tabs';
import Tab from '../../ui/Tab';
import Checkbox from '../../ui/Checkbox';
import { TrashIcon } from 'lucide-react';

//================================================================================
// 1. Дочерний компонент для ОДНОГО слайда
//================================================================================
const SlideBlock = forwardRef(({ block, children, className, style, actions, mode, ...rest }, ref) => {
    // Этот компонент - просто обертка с нужным классом для Swiper
    return (
        <div ref={ref} className={classNames('swiper-slide', styles.slide, className)} style={style} {...rest}>
            {children}
            {mode === 'edit' && (
                <div className={styles.slideOverlay}>
                    <ToolbarButton title="Удалить слайд" onClick={(e) => { e.stopPropagation(); actions.delete(block.id); }} small>
                        <TrashIcon />
                    </ToolbarButton>
                </div>
            )}
        </div>
    );
});


//================================================================================
// 2. Родительский компонент-обертка для Слайдера
//================================================================================
const SliderBlock = forwardRef(({ block, children, className, style, ...rest }, ref) => {
    const swiperRef = useRef(null);
    const { props = {} } = block;

    useEffect(() => {
        if (!swiperRef.current) return;

        // Инициализируем Swiper
        const swiper = new Swiper(swiperRef.current, {
            modules: [Navigation, Pagination],
            loop: props.loop || false,
            pagination: props.pagination ? { el: '.swiper-pagination', clickable: true } : false,
            navigation: props.navigation ? { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' } : false,
        });

        // Уничтожаем инстанс Swiper при размонтировании компонента
        return () => swiper.destroy(true, true);
        // Пересоздаем слайдер при изменении настроек
    }, [props.loop, props.pagination, props.navigation, children.length]); // children.length для переинициализации при добавлении/удалении слайдов

    return (
        <motion.div ref={ref} className={classNames(styles.sliderWrapper, className)} style={style} {...rest}>
            <div ref={swiperRef} className="swiper">
                <div className="swiper-wrapper">
                    {children}
                </div>
                {/* Элементы управления Swiper */}
                {props.pagination && <div className="swiper-pagination"></div>}
                {props.navigation && (
                    <>
                        <div className="swiper-button-prev"></div>
                        <div className="swiper-button-next"></div>
                    </>
                )}
            </div>
        </motion.div>
    );
});

//================================================================================
// 3. Конфигурация для редактора
//================================================================================

// --- Конфиг для Слайда ---
SlideBlock.blockInfo = {
    type: 'custom/slide',
    label: 'Слайд',
    isContainer: true,
    parent: ['custom/slider'],
    supports: { inserter: false },
    defaultData: () => ({
        type: 'custom/slide',
        children: [{
            type: 'core/image',
            id: nanoid(), // ID будет одинаковым, но это временно
            props: { src: 'https://via.placeholder.com/800x400?text=Slide' },
        }],
    }),
};

// --- Конфиг для Слайдера ---
SliderBlock.blockInfo = {
    type: 'custom/slider',
    label: 'Слайдер',
    icon: <SliderIcon />,
    isContainer: true,
    description: 'Создает интерактивную карусель из дочерних блоков (слайдов).',
    keywords: ['слайдер', 'карусель', 'галерея', 'slider', 'carousel'],

    parent: null,
    allowedBlocks: ['custom/slide'],
    supports: { reusable: true, anchor: true },

    defaultData: () => ({
        type: 'custom/slider',
        props: {
            loop: true,
            navigation: true,
            pagination: true,
        },
        variants: {
            align: 'none', // Ширина по контенту по умолчанию
        },
        children: [
            // Создаем новые объекты с уникальными ID при создании родителя
            { id: nanoid(), ...SlideBlock.blockInfo.defaultData() },
            { id: nanoid(), ...SlideBlock.blockInfo.defaultData() },
            { id: nanoid(), ...SlideBlock.blockInfo.defaultData() },
        ],
    }),

    supportedVariants: {
        align: {
            label: 'Выравнивание блока',
            options: [
                { value: 'none', label: 'Контент', icon: <ContentWidthIcon /> },
                { value: 'wide', label: 'Широкая', icon: <WideWidthIcon /> },
                { value: 'full', label: 'Во всю ширину', icon: <FullWidthIcon /> },
            ],
        },
    },

    getToolbarItems: ({ block, actions }) => {
        const { variants = {} } = block;
        const updateVariant = (name, value) => {
            actions.update(block.id, { variants: { ...variants, [name]: value } });
        };
        const handleAddSlide = () => {
            // --- ИЗМЕНЕНИЕ: Используем статический объект и генерируем ID здесь ---
            const newSlide = { id: nanoid(), ...SlideBlock.blockInfo.defaultData() };
            actions.update(block.id, { children: [...block.children, newSlide] });
        };
        return (
            <>
                <div className="toolbarButtonGroup">
                    {SliderBlock.blockInfo.supportedVariants.align.options.map(opt => (
                        <ToolbarButton
                            key={opt.value}
                            title={opt.label}
                            isActive={(variants.align || 'none') === opt.value}
                            onClick={() => updateVariant('align', opt.value)}
                        >
                            {opt.icon}
                        </ToolbarButton>
                    ))}
                </div>
                <div className="toolbarSeparator"></div>
                <ToolbarButton title="Добавить слайд" onClick={handleAddSlide}>
                    <PlusIcon />
                </ToolbarButton>
            </>
        );
    },

    getEditor: ({ block, onChange }) => {
        const { props = {} } = block;
        const handlePropsChange = (newProps) => onChange({ props: { ...props, ...newProps } });

        return (
            <Tabs>
                <Tab title="Настройки">
                    <h4>Управление</h4>
                    <Checkbox label="Стрелки навигации" checked={!!props.navigation} onChange={(e) => handlePropsChange({ navigation: e.target.checked })} />
                    <Checkbox label="Пагинация (точки)" checked={!!props.pagination} onChange={(e) => handlePropsChange({ pagination: e.target.checked })} />
                    <Checkbox label="Бесконечная прокрутка" checked={!!props.loop} onChange={(e) => handlePropsChange({ loop: e.target.checked })} />
                </Tab>
            </Tabs>
        );
    }
};

//================================================================================
// 4. Экспорты
//================================================================================
export const SliderBlockWrapped = withBlock(SliderBlock);
export const SlideBlockWrapped = withBlock(SlideBlock);

export default SliderBlockWrapped;