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
} from "./constants";
import { PostFields } from "./types";
import { db } from "@/firebase";

export const getPost = async (id: string) => {
  const dbRef = ref(db, `${POSTS}/${id}`);
  const snapshot = await get(dbRef);
  return snapshot.val();
};

export const getPosts = async () => {
  const dbRef = ref(db, POSTS);
  const snapshot = await get(dbRef);
  return snapshot.val();
};

export const getPostIds = async () => {
  const posts = await getPosts();
  return Object.keys(posts);
};

export const setPostField = async (
  postId: string,
  postField: string,
  value: any
) => {
  set(ref(db, `${POSTS}/${postId}/${postField}`), value);
};

export const getPostField = async (postId: string, postField: string) => {
  const dbRef = ref(db, `${POSTS}/${postId}/${postField}`);
  const snapshot = await get(dbRef);
  return snapshot.val();
};

export const createPost = async (id: any) => {
  const postIds = await getPostIds();
  if (postIds.includes(id)) {
    return false;
  }
  const value: PostFields = {
    [CONTENT]: "content",
    [CREATED_AT]: 123123123,
    [UPDATED_AT]: 123123123,
    [DESCRIPTION]: "description",
    [LOCATION]: "",
    [PUBLISHED]: false,
    [TAGS]: "",
    [TITLE]: "",
    [AUTHOR]: "",
    id: id,
    [IMAGE]: "https://source.unsplash.com/random/800x600",
  };

  set(ref(db, `${POSTS}/${id}`), value);
  return true;
};

export const updatePost = async (id: string, value: any) => {
  set(ref(db, `${POSTS}/${id}`), value);
};
