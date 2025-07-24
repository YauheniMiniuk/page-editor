import React from 'react';
import { useGlobalStyles } from '../../contexts/GlobalStylesContext';
import Checkbox from '../../ui/Checkbox';
import Input from '../../ui/Input';

const GlobalStylesPanel = ({ block, onChange }) => {
    const { globalClasses } = useGlobalStyles();
    const { props = {} } = block;

    const handleClassChange = (selectedClassName) => {
        const currentClasses = props.className ? props.className.split(' ').filter(Boolean) : [];
        const newClasses = new Set(currentClasses);

        if (newClasses.has(selectedClassName)) {
            newClasses.delete(selectedClassName);
        } else {
            newClasses.add(selectedClassName);
        }
        
        onChange({ props: { ...props, className: Array.from(newClasses).join(' ') } });
    };

    return (
        <>
            <hr />
            <h4>Глобальные стили</h4>
            {globalClasses.length > 0 ? (
                globalClasses.map(cls => (
                    <Checkbox
                        key={cls.id}
                        label={cls.label}
                        checked={props.className?.split(' ').includes(cls.name)}
                        onChange={() => handleClassChange(cls.name)}
                        helpText={`.${cls.name}`}
                    />
                ))
            ) : (
                <p style={{ fontSize: '12px', opacity: 0.7 }}>Глобальные классы еще не созданы.</p>
            )}
            
            {/* Оставляем возможность ручного ввода для продвинутых случаев */}
            <Input
              label="Все CSS-классы блока"
              value={props.className || ''}
              onChange={(e) => onChange({ props: { ...props, className: e.target.value } })}
              helpText="Управляйте всеми классами блока вручную."
            />
        </>
    );
};

export default GlobalStylesPanel;