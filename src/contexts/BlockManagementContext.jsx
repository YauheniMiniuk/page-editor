import React, { createContext, useContext } from 'react';
import useBlockManagement from '../hooks/useBlockManagement'; // Убедись, что путь верный

// 1. Создаем сам контекст
const BlockManagementContext = createContext(null);

// 2. Создаем "Провайдер" - компонент, который будет "раздавать" состояние
export const BlockManagementProvider = ({ children }) => {
  // Вся логика из нашего хука теперь живет здесь, один раз
  const blockManager = useBlockManagement([]);

  return (
    <BlockManagementContext.Provider value={blockManager}>
      {children}
    </BlockManagementContext.Provider>
  );
};

// 3. Создаем кастомный хук для удобного доступа к контексту.
// Вместо двух импортов (useContext, BlockManagementContext) в каждом файле, будем использовать один.
export const useBlockManager = () => {
  const context = useContext(BlockManagementContext);
  if (!context) {
    throw new Error('useBlockManager must be used within a BlockManagementProvider');
  }
  return context;
};