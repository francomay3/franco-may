import ImageBlock, {
  ImageBlockDataDefault,
  ExampleImageBlock,
} from "./components/ImageBlock";
import TextBlock, {
  TextBlockDataDefault,
  ExampleTextBlock,
} from "./components/TextBlock";

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
