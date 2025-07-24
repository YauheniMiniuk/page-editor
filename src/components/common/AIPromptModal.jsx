import React, { useState, useEffect } from 'react';
import styles from './AiPromptModal.module.css';
import { Sparkles, X } from 'lucide-react';

const AiPromptModal = ({ isOpen, onClose, onSubmit, blockContext, isGenerating }) => {
    const [prompt, setPrompt] = useState('');

    // Сбрасываем текст при каждом открытии
    useEffect(() => {
        if (isOpen) {
            setPrompt('');
        }
    }, [isOpen]);


    const handleSubmit = (e) => {
        e.preventDefault();
        if (prompt && !isGenerating) {
            onSubmit(prompt);
        }
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h3><Sparkles size={20} /> Генерация с AI</h3>
                    <button onClick={onClose} className={styles.closeButton}><X size={24} /></button>
                </div>
                <div className={styles.content}>
                    <form onSubmit={handleSubmit}>
                        <div className={styles.contextSection}>
                            <label>Контекст (блок и его дочерние элементы):</label>
                            <pre className={styles.contextPre}>
                                {JSON.stringify(blockContext, null, 2)}
                            </pre>
                        </div>

                        <div className={styles.promptSection}>
                            <label htmlFor="ai-prompt">Ваш запрос:</label>
                            <textarea
                                id="ai-prompt"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Например: Сделай этот текст более формальным и добавь призыв к действию."
                                className={styles.promptTextarea}
                                rows={4}
                            />
                        </div>

                        <div className={styles.footer}>
                            <button type="button" onClick={onClose} className={styles.cancelButton}>Отмена</button>
                            <button type="submit" className={styles.submitButton} disabled={isGenerating || !prompt}>
                                {isGenerating ? 'Генерация...' : 'Сгенерировать'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AiPromptModal;