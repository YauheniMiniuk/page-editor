import AccordionBlockWrapped, { AccordionBlock, AccordionItemBlock, AccordionItemBlockWrapped } from './AccordionBlock';
import AmchartBlock from './AmchartBlock';
import AnchorBlock from './AnchorBlock';
import BubbleChartBlock from './BubbleChartBlock';
import ButtonBlock from './ButtonBlock';
import CardBlock from './CardBlock';
import CodeBlock from './CodeBlock';
import ColumnBlock from './ColumnBlock';
import ColumnsBlock from './ColumnsBlock';
import ContainerBlock from './ContainerBlock';
import DisbalanceChartBlock from './DisbalanceChartBlock';
import DividerBlock from './DividerBlock';
import GalleryBlockWrapped, { GalleryImageBlockWrapped } from './GalleryBlock';
import HeadingBlock from './HeadingBlock';
import IconBlock from './IconBlock';
import ImageBlock from './ImageBlock';
import ListBlock from './ListBlock';
import QuoteBlock from './QuoteBlock';
import RiskBlock from './RiskBlock';
import RiskChartBlock from './RiskChartBlock';
import RiskProfileChartBlock from './RiskProfileChartBlock';
import SliderBlockWrapped, { SlideBlockWrapped } from './SliderBlock';
import SpacerBlock from './SpacerBlock';
import TableBlock from './table/TableBlock';
import TableBodyBlock from './table/TableBodyBlock';
import TableCellBlock from './table/TableCellBlock';
import TableHeadBlock from './table/TableHeadBlock';
import TableRowBlock from './table/TableRowBlock';
import TabsBlockWrapped, { TabItemBlockWrapped } from './TabsBlock';
import TextBlock from './TextBlock';
import VideoBlock from './VideoBlock';

const ALL_COMPONENTS = [
  ContainerBlock,
  HeadingBlock,
  TextBlock,
  // TableBlock,
  // TableHeadBlock,
  // TableBodyBlock,
  // TableRowBlock,
  // TableCellBlock,
  AmchartBlock,
  DisbalanceChartBlock,
  RiskChartBlock,
  BubbleChartBlock,
  RiskBlock,
  RiskProfileChartBlock,
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