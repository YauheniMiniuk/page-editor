import { AccordionBlock, AccordionItemBlock } from './AccordionBlock';
import ButtonBlock from './ButtonBlock';
import ContainerBlock from './ContainerBlock';
import ImageBlock from './ImageBlock';
import SpacerBlock from './SpacerBlock';
import TextBlock from './TextBlock';

const ALL_COMPONENTS = [
  ContainerBlock,
  TextBlock,
  ImageBlock,
  ButtonBlock,
  SpacerBlock,
  AccordionBlock,
  AccordionItemBlock
];

export const BLOCK_COMPONENTS = ALL_COMPONENTS.reduce((acc, component) => {
  const type = component.blockInfo?.type;
  if (type) {
    acc[type] = component;
  }
  return acc;
}, {});

export const AVAILABLE_BLOCKS = ALL_COMPONENTS.map(Component => {
  if (!Component.blockInfo) return null;
  return {
    type: Component.blockInfo.type,
    label: Component.blockInfo.label,
    icon: Component.blockInfo.icon,
    defaultData: Component.blockInfo.defaultData,
  };
}).filter(Boolean);