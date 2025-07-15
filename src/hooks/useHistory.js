import { useState, useCallback, useMemo } from 'react';

export const useHistory = (initialState) => {
  const [history, setHistory] = useState([initialState]);
  const [index, setIndex] = useState(0);

  const present = useMemo(() => history[index], [history, index]);

  const setState = useCallback((action) => {
    const newState = typeof action === 'function' ? action(present) : action;
    
    // Если новое состояние идентично текущему, ничего не делаем
    if (JSON.stringify(newState) === JSON.stringify(present)) {
      return;
    }

    // Если мы сделали undo, а потом новое действие, "будущее" нужно отрезать
    const newHistory = history.slice(0, index + 1);
    
    setHistory([...newHistory, newState]);
    setIndex(newHistory.length);
  }, [present, index, history]);

  const undo = useCallback(() => {
    if (index > 0) {
      setIndex(prevIndex => prevIndex - 1);
    }
  }, [index]);

  const redo = useCallback(() => {
    if (index < history.length - 1) {
      setIndex(prevIndex => prevIndex + 1);
    }
  }, [index, history.length]);

  const reset = useCallback((newState) => {
    setHistory([newState]);
    setIndex(0);
  }, []);

  return {
    state: present,
    setState,
    reset,
    undo,
    redo,
    resetHistory: reset,
    canUndo: index > 0,
    canRedo: index < history.length - 1,
  };
};