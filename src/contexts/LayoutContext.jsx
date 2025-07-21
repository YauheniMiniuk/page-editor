import React, { createContext, useContext, useState, useRef, useLayoutEffect } from 'react';

const LayoutContext = createContext({ headerHeight: 60 }); // 60px - значение по умолчанию

export const useLayout = () => useContext(LayoutContext);

export const LayoutProvider = ({ children }) => {
    const [headerHeight, setHeaderHeight] = useState(60);
    const headerRef = useRef(null); // Этот ref мы повесим на шапку

    // Измеряем высоту шапки после рендера
    useLayoutEffect(() => {
        if (headerRef.current) {
            setHeaderHeight(headerRef.current.offsetHeight);
        }
    }, []); // Пустой массив, чтобы сработать один раз

    // Передаем и высоту, и ref для шапки
    const value = { headerHeight, headerRef };

    return (
        <LayoutContext.Provider value={value}>
            {children}
        </LayoutContext.Provider>
    );
};