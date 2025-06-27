// --- ШАГ 1: Импортируем все наши компоненты-блоки ---
// Это единственное место, где нужно будет добавлять новые компоненты.
import TextBlock from '../components/blocks/TextBlock';
import ContainerBlock from '../components/blocks/ContainerBlock';
import ImageBlock from '../components/blocks/ImageBlock';
import ButtonBlock from '../components/blocks/ButtonBlock';
import SpacerBlock from '../components/blocks/SpacerBlock';
import { wrapWithForwardRef } from './forwardRef';

// Собираем все компоненты в один массив для удобной обработки
const ALL_COMPONENTS = [
  ContainerBlock,
  TextBlock,
  ImageBlock,
  ButtonBlock,
  SpacerBlock,
];

// --- ШАГ 2: Динамически создаем объект BLOCK_TYPES ---
// Проходимся по каждому компоненту и извлекаем его строковый тип из статического свойства `blockInfo`.
// Результат будет выглядеть так: { TEXT: 'TEXT', CONTAINER: 'CONTAINER', ... }
export const BLOCK_TYPES = ALL_COMPONENTS.reduce((acc, component) => {
  const type = component.blockInfo?.type;
  if (type) {
    // Используем тип и как ключ, и как значение для простоты
    acc[type] = type;
  }
  return acc;
}, {});


// --- ШАГ 3: Динамически создаем карту BLOCK_COMPONENTS ---
// Сопоставляем строковый тип с самим React-компонентом.
// Результат будет выглядеть так: { TEXT: TextBlock, CONTAINER: ContainerBlock, ... }
export const BLOCK_COMPONENTS = ALL_COMPONENTS.reduce((acc, component) => {
  const type = component.blockInfo?.type;
  if (type) {
    acc[type] = component;
  }
  return acc;
}, {});


// --- ШАГ 4: Динамически генерируем список доступных блоков для сайдбара ---
// Эта логика берет информацию из уже созданной карты `BLOCK_COMPONENTS`.
export const AVAILABLE_BLOCKS = Object.values(BLOCK_COMPONENTS)
  .map(Component => {
    // Проверяем, что у компонента есть вся необходимая статическая информация
    if (!Component.blockInfo) {
      console.warn(`Компонент ${Component.name} не имеет статического свойства 'blockInfo' и не будет добавлен в сайдбар.`);
      return null;
    }
    return {
      type: Component.blockInfo.type,
      label: Component.blockInfo.label,
      icon: Component.blockInfo.icon,
      defaultData: Component.blockInfo.defaultData,
    };
  })
  .filter(Boolean); // Фильтруем компоненты, у которых по какой-то причине нет `blockInfo`

// Начальное состояние для пустого редактора
export const initialBlockState = [];

// Режимы редактора
export const EDITOR_MODS = {
  VIEW: 'view',
  EDIT: 'edit'
};
