import React from 'react';
import * as icons from "../utils/icons";

// Этот компонент будет рендерить нужную иконку по ее имени
const Icon = ({ name, ...props }) => {
    // Находим компонент иконки в импортированном объекте
    const IconComponent = icons[name];

    if (!IconComponent) {
        // Если иконка не найдена, можно вернуть заглушку
        return <icons.HelpIcon {...props} />;
    }

    return <IconComponent {...props} />;
};

// Экспортируем также список всех доступных иконок для панели настроек
export const availableIcons = Object.keys(icons).map(name => ({
    name,
    Component: icons[name]
}));

export default Icon;