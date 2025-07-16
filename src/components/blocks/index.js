import AccordionBlockWrapped, { AccordionBlock, AccordionItemBlock, AccordionItemBlockWrapped } from './AccordionBlock';
import AnchorBlock from './AnchorBlock';
import ButtonBlock from './ButtonBlock';
import CardBlock from './CardBlock';
import CodeBlock from './CodeBlock';
import ColumnBlock from './ColumnBlock';
import ColumnsBlock from './ColumnsBlock';
import ContainerBlock from './ContainerBlock';
import DividerBlock from './DividerBlock';
import GalleryBlockWrapped, { GalleryImageBlockWrapped } from './GalleryBlock';
import HeadingBlock from './HeadingBlock';
import IconBlock from './IconBlock';
import ImageBlock from './ImageBlock';
import ListBlock from './ListBlock';
import QuoteBlock from './QuoteBlock';
import SliderBlockWrapped, { SlideBlockWrapped } from './SliderBlock';
import SpacerBlock from './SpacerBlock';
import TabsBlockWrapped, { TabItemBlockWrapped } from './TabsBlock';
import TextBlock from './TextBlock';
import VideoBlock from './VideoBlock';

const ALL_COMPONENTS = [
  ContainerBlock,
  HeadingBlock,
  TextBlock,
  QuoteBlock,
  ListBlock,
  ImageBlock,
  VideoBlock,
  ButtonBlock,
  SpacerBlock,
  CodeBlock,
  AccordionBlockWrapped,
  AccordionItemBlockWrapped,
  ColumnsBlock,
  ColumnBlock,
  GalleryBlockWrapped,
  GalleryImageBlockWrapped,
  IconBlock,
  TabsBlockWrapped,
  TabItemBlockWrapped,
  CardBlock,
  SliderBlockWrapped,
  SlideBlockWrapped,
  DividerBlock,
  AnchorBlock,
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