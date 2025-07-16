import React from 'react';
import styles from './StateSelector.module.css';
import classNames from 'classnames';

const STATES = [
  { key: 'default', label: 'Default' },
  { key: 'hover', label: 'Hover' },
  // В будущем можно добавить: { key: 'focus', label: 'Focus' }
];

const StateSelector = ({ value, onChange }) => {
  return (
    <div className={styles.wrapper}>
      {STATES.map(state => (
        <button
          key={state.key}
          className={classNames(styles.button, { [styles.active]: value === state.key })}
          onClick={() => onChange(state.key)}
        >
          {state.label}
        </button>
      ))}
    </div>
  );
};

export default StateSelector;