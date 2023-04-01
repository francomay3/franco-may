import {
  POST_FIELDS,
  AUTHOR,
  CONTENT,
  CREATED_AT,
  DESCRIPTION,
  IMAGE,
  LOCATION,
  TAGS,
  TITLE,
  UPDATED_AT,
  PUBLISHED,
  SLUG,
} from "@/utils/constants";
import { iconIds } from "@/components/design-system/Icon";
import { ThemeType } from "@/providers/theme/themeValues";

export type BlogField = typeof POST_FIELDS[number];
export type IconId = typeof iconIds[number];
export interface PostFields {
  [AUTHOR]: string;
  [CONTENT]: string;
  [CREATED_AT]: number;
  [DESCRIPTION]: string;
  [IMAGE]: string;
  [LOCATION]: string;
  [TAGS]: string;
  [TITLE]: string;
  [UPDATED_AT]: number;
  [PUBLISHED]: boolean;
  [SLUG]: string;
}

export type ImageData = {
  url: string;
  name: string;
};

export type HtmlElementTag =
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "h6"
  | "p"
  | "span";

export type Theme = ThemeType;
export type Colors = keyof ThemeType["colors"];
