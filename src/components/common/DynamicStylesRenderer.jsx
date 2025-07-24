import React from 'react';
import { useGlobalStyles } from '../../contexts/GlobalStylesContext';

const DynamicStylesRenderer = () => {
    const { globalClasses } = useGlobalStyles();

    // Просто склеиваем все CSS-строки в одну
    const stylesheet = globalClasses.map(styleBlock => styleBlock.css).join('\n');

    return (
        <style>
            {stylesheet}
        </style>
    );
};

export default DynamicStylesRenderer;