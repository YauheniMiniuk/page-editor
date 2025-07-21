// src/hooks/usePanelManager.js
import { useState } from 'react';

export const usePanelManager = () => {
    const [activeLeftPanel, setActiveLeftPanel] = useState(null);
    const [panelContent, setPanelContent] = useState(null);
    const [isPropertiesPanelVisible, setPropertiesPanelVisible] = useState(true);
    const [isAnimating, setIsAnimating] = useState(false);

    const handleToggleLeftPanel = (panelName) => {
        if (isAnimating) return;
        const currentPanel = activeLeftPanel;

        if (currentPanel && currentPanel !== panelName) {
            setIsAnimating(true);
            setActiveLeftPanel(null);
            setTimeout(() => {
                setPanelContent(panelName);
                setActiveLeftPanel(panelName);
                setIsAnimating(false);
            }, 300);
        } else {
            if (!currentPanel) {
                setPanelContent(panelName);
            }
            setActiveLeftPanel(current => (current === panelName ? null : panelName));
        }
    };

    const handleTogglePropertiesPanel = () => {
        setPropertiesPanelVisible(prev => !prev);
    };

    return {
        activeLeftPanel,
        panelContent,
        isPropertiesPanelVisible,
        handleToggleLeftPanel,
        handleTogglePropertiesPanel,
    };
};