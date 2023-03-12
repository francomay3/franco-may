export type ImageBlockData = {
  title: string;
  caption: string;
  url: string;
  blockId: string;
  type: "image";
};

export type TextBlockData = {
  data: string;
  blockId: string;
  type: "text";
};

export type BlockData = ImageBlockData | TextBlockData;
