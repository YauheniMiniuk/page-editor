import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

const GlobalStylesContext = createContext(null);

export const GlobalStylesProvider = ({ children }) => {
    const [globalClasses, setGlobalClasses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // 1. Загрузка данных с сервера при первом рендере
    useEffect(() => {
        setIsLoading(true);
        fetch('/api/styles')
            .then(res => res.json())
            .then(data => {
                if (data && Array.isArray(data)) {
                    setGlobalClasses(data);
                }
            })
            .catch(err => console.error("Ошибка загрузки стилей с сервера", err))
            .finally(() => setIsLoading(false));
    }, []); // Пустой массив зависимостей = сработает один раз

    // 2. Создаем переиспользуемую функцию для сохранения данных на сервере
    const saveStylesToServer = useCallback(async (updatedStyles) => {
        try {
            const response = await fetch('/api/styles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedStyles)
            });
            if (!response.ok) {
                throw new Error('Сервер ответил ошибкой');
            }
            // Можно добавить логику для обработки успешного сохранения, например, показать уведомление.
        } catch (err) {
            console.error("Ошибка сохранения стилей на сервере", err);
            // 🔥 ВАЖНО: здесь нужно реализовать логику отката изменений, если сервер не смог их сохранить.
            // Например, можно показать пользователю ошибку и перезагрузить стили с сервера.
        }
    }, []);

    // 3. Переписываем экшены, чтобы они использовали saveStylesToServer
    const actions = useMemo(() => ({
        addClass: (newClassData) => {
            const newClass = { ...newClassData, id: uuidv4() };
            
            // Используем функциональную форму setState, чтобы избежать проблем со stale state
            setGlobalClasses(prevStyles => {
                const updatedStyles = [...prevStyles, newClass];
                saveStylesToServer(updatedStyles); // Отправляем на сервер
                return updatedStyles; // Обновляем локальное состояние
            });
        },
        updateClass: (id, updatedProps) => {
            setGlobalClasses(prevStyles => {
                const updatedStyles = prevStyles.map(c => (c.id === id ? { ...c, ...updatedProps } : c));
                saveStylesToServer(updatedStyles); // Отправляем на сервер
                return updatedStyles; // Обновляем локальное состояние
            });
        },
        deleteClass: (id) => {
            setGlobalClasses(prevStyles => {
                const updatedStyles = prevStyles.filter(c => c.id !== id);
                saveStylesToServer(updatedStyles); // Отправляем на сервер
                return updatedStyles; // Обновляем локальное состояние
            });
        }
    }), [saveStylesToServer]); // Добавляем saveStylesToServer в зависимости useMemo

    const value = { globalClasses, actions, isLoading };

    return (
        <GlobalStylesContext.Provider value={value}>
            {children}
        </GlobalStylesContext.Provider>
    );
};

export const useGlobalStyles = () => useContext(GlobalStylesContext);