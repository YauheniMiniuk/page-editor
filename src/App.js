import React, { useState } from 'react';
import DndCanvasBuilder from './components/DndCanvasBuilder';
import './App.module.css';
import { EDITOR_MODS } from './utils/constants';
import { BrowserRouter, Routes, Route } from 'react-router';
import PagesDashboard from './components/PagesDashboard';
import { BlockManagementProvider } from './contexts/BlockManagementContext';
import { LayoutProvider } from './contexts/LayoutContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { GlobalStylesProvider } from './contexts/GlobalStylesContext';

export default function App() {
  const [mode, setMode] = useState(EDITOR_MODS.VIEW)

  const handleChangeMode = () => {
    setMode(mode === EDITOR_MODS.VIEW ? EDITOR_MODS.EDIT : EDITOR_MODS.VIEW);
  }
  return (
    <>
      <BlockManagementProvider>
        <LayoutProvider>
          <ThemeProvider>
            <GlobalStylesProvider>
              <BrowserRouter>
                <Routes>
                  <Route path='/' element={
                    <PagesDashboard />
                  }
                  />
                  <Route
                    path='/editor/:slug'
                    element={<DndCanvasBuilder initialMode="edit" />}
                  />
                  <Route
                    path='/page/:slug'
                    element={<DndCanvasBuilder initialMode="view" />}
                  />
                </Routes>
              </BrowserRouter>
            </GlobalStylesProvider>
          </ThemeProvider>
        </LayoutProvider>
      </BlockManagementProvider>
    </>
  );
}