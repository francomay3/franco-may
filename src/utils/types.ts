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
