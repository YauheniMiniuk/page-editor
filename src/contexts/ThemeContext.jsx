import React, { createContext, useContext, useState, useEffect } from 'react';

// 1. Создаем контекст с начальным значением null
const ThemeContext = createContext(null);

// 2. Создаем кастомный хук для удобного доступа к контексту
export const useTheme = () => useContext(ThemeContext);

// 3. Создаем Провайдер, который будет управлять состоянием темы
export const ThemeProvider = ({ children }) => {
    const [activeTheme, setActiveTheme] = useState(null);
    const [allFonts, setAllFonts] = useState([]);

    // Загружаем все доступные шрифты при монтировании
    useEffect(() => {
        const fetchFonts = async () => {
            try {
                const res = await fetch('/api/fonts');
                const data = await res.json();
                setAllFonts(data);
            } catch (error) {
                console.error("Не удалось загрузить шрифты", error);
            }
        };
        fetchFonts();
    }, []);

    // Применяем стили темы и шрифты, когда activeTheme меняется
    useEffect(() => {
        const styleElement = document.getElementById('theme-styles');
        if (styleElement) styleElement.remove(); // Очищаем старые стили

        if (!activeTheme || !allFonts.length) return;

        const { colors, typography } = activeTheme.styles_json;
        const root = document.documentElement;

        // Применяем цвета как CSS переменные
        for (const [name, value] of Object.entries(colors)) {
            root.style.setProperty(`--theme-color-${name}`, value);
        }

        // Применяем типографику как CSS переменные
        for (const [element, styles] of Object.entries(typography)) {
            root.style.setProperty(`--theme-font-family-${element}`, styles.fontFamily);
            root.style.setProperty(`--theme-font-size-${element}`, styles.fontSize + 'px');
            // ... и другие свойства типографики
        }

        // Внедряем CSS правила для шрифтов темы в <head>
        const newStyleElement = document.createElement('style');
        newStyleElement.id = 'theme-styles';
        
        let fontCssRules = '';
        const themeFontNames = new Set(Object.values(typography).map(t => t.fontFamily));
        
        allFonts.forEach(font => {
            if (themeFontNames.has(font.name)) {
                fontCssRules += font.css_rules + '\n';
            }
        });

        newStyleElement.innerHTML = fontCssRules;
        document.head.appendChild(newStyleElement);

    }, [activeTheme, allFonts]);

    const applyTheme = async (themeId) => {
        try {
            const res = await fetch(`/api/themes/${themeId}`);
            const themeData = await res.json();
            setActiveTheme(themeData);
        } catch (error) {
            console.error(`Не удалось применить тему с ID ${themeId}`, error);
        }
    };

    const value = { activeTheme, applyTheme };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};