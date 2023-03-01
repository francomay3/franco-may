import { db } from "@/firebase";
import { ref, get, set } from "firebase/database";

export const getDate = (date: Date) => {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
  ];
  const days = [
    "first",
    "second",
    "third",
    "fourth",
    "fifth",
    "sixth",
    "seventh",
    "eighth",
    "ninth",
    "tenth",
    "eleventh",
    "twelfth",
    "thirteenth",
    "fourteenth",
    "fifteenth",
    "sixteenth",
    "seventeenth",
    "eighteenth",
    "nineteenth",
    "twentieth",
    "twenty-first",
    "twenty-second",
    "twenty-third",
    "twenty-fourth",
    "twenty-fifth",
    "twenty-sixth",
    "twenty-seventh",
    "twenty-eighth",
    "twenty-ninth",
    "thirtieth",
    "thirty-first",
  ];
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  return `${days[day - 1]} of ${months[month]}, ${year}`;
};

export const anyOf = (obj: any) => {
  const keys = Object.keys(obj);
  const randomKey = keys[(keys.length * Math.random()) << 0];
  return obj[randomKey];
};

export const getPost = async (id: string) => {
  const dbRef = ref(db, `posts/${id}`);
  const snapshot = await get(dbRef);
  return snapshot.val();
};

export const getPosts = async () => {
  const dbRef = ref(db, "posts");
  const snapshot = await get(dbRef);
  return snapshot.val();
};

export const getPostIds = async () => {
  const posts = await getPosts();
  return Object.keys(posts);
};

// export const setPost = async (postId: string, data: any) => {
//   await set(ref(db, `posts/${postId}`), data);
// };

export const setPostContent = async (postId: string, data: string) => {
  set(ref(db, `posts/${postId}/content`), data);
};

export const setPostContentBackup = async (postId: string, data: string) => {
  if (!data || !postId) return;
  set(ref(db, `posts/${postId}/editorState`), data);
  set(ref(db, `posts/${postId}/hasUnsavedChanges`), true);
};

// get editorState
export const getPostContentBackup = async (postId: string) => {
  const dbRef = ref(db, `posts/${postId}/editorState`);
  const snapshot = await get(dbRef);
  return snapshot.val();
};

export const publishPost = async (postId: string) => {
  set(ref(db, `posts/${postId}/published`), true);
};

export const unpublishPost = async (postId: string) => {
  set(ref(db, `posts/${postId}/published`), false);
};

export const setHasUnsavedChanges = async (postId: string, value: boolean) => {
  set(ref(db, `posts/${postId}/hasUnsavedChanges`), value);
};
