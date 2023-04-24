export type ImageBlockData = {
  title: string;
  caption: string;
  url: string;
  blockId: number;
  type: "image";
};

export type TextBlockData = {
  data: string;
  blockId: number;
  type: "text";
};

export type BlockData = ImageBlockData | TextBlockData;
