import { BLOCK_COMPONENTS, AVAILABLE_BLOCKS } from '../components/blocks';
export { BLOCK_COMPONENTS, AVAILABLE_BLOCKS };

export const BLOCK_TYPES = Object.keys(BLOCK_COMPONENTS).reduce((acc, key) => {
    const typeName = key.split('/')[1]?.toUpperCase();
    acc[typeName] = key;
    return acc;
}, {});

export const initialBlockState = [];

// Режимы редактора
export const EDITOR_MODS = {
  VIEW: 'view',
  EDIT: 'edit'
};
