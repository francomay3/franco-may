import ImageBlock, {
  ImageBlockDataDefault,
  ExampleImageBlock,
} from "./ImageBlock";
import TextBlock, { TextBlockDataDefault, ExampleTextBlock } from "./TextBlock";

export {
  ImageBlock,
  ImageBlockDataDefault,
  ExampleImageBlock,
  TextBlock,
  TextBlockDataDefault,
  ExampleTextBlock,
};

export const blocksExamples = [
  {
    title: "Image With Caption",
    Component: ExampleImageBlock,
    data: ImageBlockDataDefault,
  },
  {
    title: "Text Block",
    Component: ExampleTextBlock,
    data: TextBlockDataDefault,
  },
];
