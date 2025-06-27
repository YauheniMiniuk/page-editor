import React, { useState } from 'react';
import DndCanvasBuilder from './components/DndCanvasBuilder';
import './App.module.css';
import { EDITOR_MODS } from './utils/constants';
import { BrowserRouter, Routes, Route } from 'react-router';
import PagesDashboard from './components/PagesDashboard';
import { BlockManagementProvider } from './contexts/BlockManagementContext';

export default function App() {
  const [mode, setMode] = useState(EDITOR_MODS.VIEW)

  const handleChangeMode = () => {
    setMode(mode === EDITOR_MODS.VIEW ? EDITOR_MODS.EDIT : EDITOR_MODS.VIEW);
  }
  return (
    <>
      <BlockManagementProvider>
        <BrowserRouter>
          <Routes>
            <Route path='/' element={
              <PagesDashboard />
            }
            />
            <Route path='/editor/:slug' element={
              <DndCanvasBuilder mode={EDITOR_MODS.EDIT} />
            }
            />
            <Route path='/page/:slug' element={
              <DndCanvasBuilder mode={EDITOR_MODS.VIEW} />
            }
            />
          </Routes>
        </BrowserRouter>
      </BlockManagementProvider>


    </>
  );
}