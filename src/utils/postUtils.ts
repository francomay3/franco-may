import { ref, get, set } from "firebase/database";
import {
  TAGS,
  POSTS,
  CONTENT,
  CREATED_AT,
  UPDATED_AT,
  DESCRIPTION,
  LOCATION,
  PUBLISHED,
  TITLE,
  AUTHOR,
  IMAGE,
  SLUG,
} from "./constants";
import { PostFields } from "./types";
import { db } from "@/firebase";
import {
  ImageBlockDataDefault,
  TextBlockDataDefault,
} from "@/components/pages/post/connectedFields/content/blocks";

export const getPost = async (slug: string) => {
  const dbRef = ref(db, `${POSTS}/${slug}`);
  const snapshot = await get(dbRef);
  return snapshot.val();
};

export const getPosts = async () => {
  const dbRef = ref(db, POSTS);
  const snapshot = await get(dbRef);
  const rawPosts: PostFields[] = snapshot.val();
  const values = Object.values(rawPosts);
  return values.flatMap((post) => {
    if (!post || typeof post !== "object") return [];
    return [{ ...post }];
  });
};

export const getPostSlugs = async () => {
  const posts = await getPosts();
  return Object.keys(posts);
};

export const setPostField = async (
  slug: string,
  postField: string,
  value: any
) => {
  return set(ref(db, `${POSTS}/${slug}/${postField}`), value);
};

export const getPostField = async (slug: string, postField: string) => {
  const dbRef = ref(db, `${POSTS}/${slug}/${postField}`);
  const snapshot = await get(dbRef);
  return snapshot.val();
};

export const createPost = async (slug: string) => {
  try {
    const postSlugs = await getPostSlugs();
    if (postSlugs.includes(slug)) {
      return { error: "Post already exists" };
    }
    // eslint-disable-next-line no-empty
  } catch (e: any) {}
  const startingValue: PostFields = {
    [CONTENT]: JSON.stringify([
      { ...TextBlockDataDefault, blockId: 1 },
      { ...ImageBlockDataDefault, blockId: 2 },
      { ...TextBlockDataDefault, blockId: 3 },
    ]),
    [CREATED_AT]: new Date().getTime(),
    [UPDATED_AT]: new Date().getTime(),
    [DESCRIPTION]: "Blog Description",
    [LOCATION]: "Göteborg, Sverige",
    [PUBLISHED]: false,
    [TAGS]: JSON.stringify(["Tag1", "Tag2"]),
    [TITLE]: slug,
    [AUTHOR]: "Franco May",
    [SLUG]: slug,
    [IMAGE]: "https://source.unsplash.com/random/800x600",
  };

  try {
    await set(ref(db, `${POSTS}/${slug}`), startingValue);
    return true;
  } catch (e: any) {
    return { error: e.message };
  }
};

export const updatePost = async (slug: string, value: any) => {
  set(ref(db, `${POSTS}/${slug}`), value);
};
