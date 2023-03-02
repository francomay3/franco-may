import { db } from "@/firebase";
import { ref, get, set } from "firebase/database";
import { debounce } from "lodash";
import { useCallback, useEffect, useState } from "react";

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

export const prepareContentForDB = (content: string) => {
  if (!content) return null;
  const parser = new DOMParser();
  const doc = parser.parseFromString(content, "text/html");
  const nodeList = doc.body.childNodes;
  const nodes = Array.from(nodeList);

  const data = nodes.map((node) => {
    let imageData = null;
    let figureHTML = null;
    const childs = node.childNodes;
    if (childs.length > 0 && node.childNodes[0].nodeName === "IMG") {
      imageData = JSON.parse(node.childNodes[0].alt);
      const figure = document.createElement("figure");
      const img = document.createElement("img");
      const figcaption = document.createElement("figcaption");
      figcaption.innerHTML = imageData.caption;
      img.src = imageData.url;
      img.alt = imageData.title;
      figure.appendChild(img);
      figure.appendChild(figcaption);
      figureHTML = figure.outerHTML;
      console.log("figureHTML", figureHTML);
    }

    if (figureHTML) {
      return figureHTML;
    } else {
      return node.outerHTML;
    }
  });

  return JSON.stringify(data);
};

export const saveChanges = (id: string, value: string) => {
  const DBContent: string | null = prepareContentForDB(value);
  if (!DBContent) return;
  setPostContent(id, DBContent);
  setHasUnsavedChanges(id, false);
};

export const useSaveBackup = (id: string) => {
  const [content, setContent] = useState(null);
  const debouncedSave = useCallback(
    debounce((nextValue) => {
      if (nextValue === null) return;
      setPostContentBackup(id, nextValue);
    }, 1000),
    []
  );
  useEffect(() => {
    debouncedSave(content);
  }, [content]);
  useEffect(() => {
    getPostContentBackup(id).then((content) => {
      setContent(content);
    });
  }, []);
  return [content, setContent];
};