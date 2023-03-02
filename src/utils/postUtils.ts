import { db } from "@/firebase";
import { ref, get, set } from "firebase/database";
import { debounce } from "lodash";
import { useCallback, useEffect, useState } from "react";

const LOADING = "Loading...";

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

export const setPostContent = async (postId: string, data: string) => {
  set(ref(db, `posts/${postId}/content`), data);
};

export const setPostContentBackup = async (postId: string, data: string) => {
  if (!data || !postId) return;
  set(ref(db, `posts/${postId}/draftEditorState`), data);
  set(ref(db, `posts/${postId}/hasUnsavedChanges`), true);
};

export const getPostContentBackup = async (postId: string) => {
  const dbRef = ref(db, `posts/${postId}/draftEditorState`);
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

export const setPostField = async (
  postId: string,
  postField: string,
  value: string
) => {
  set(ref(db, `posts/${postId}/${postField}`), value);
};

export const getPostField = async (postId: string, postField: string) => {
  const dbRef = ref(db, `posts/${postId}/${postField}`);
  const snapshot = await get(dbRef);
  return snapshot.val();
};

export const useSetDebouncedPostField = (id: string, postField: string) => {
  const [value, setValue] = useState(LOADING);

  const debouncedSave = useCallback(
    debounce((nextValue) => {
      if (nextValue === LOADING) return;
      if (postField === "tags") {
        // trim whitespace
        const tagsValue = JSON.stringify(
          nextValue
            .split(",")
            .map((tag) => tag.trim())
            .filter((el) => el.length > 0)
        );

        setPostField(id, postField, tagsValue);
        return;
      }
      setPostField(id, postField, nextValue);
    }, 1000),
    []
  );
  useEffect(() => {
    debouncedSave(value);
  }, [value]);
  useEffect(() => {
    getPostField(id, postField).then((storedValue) => {
      if (typeof storedValue !== "string") return;
      if (postField === "tags") {
        const tags = JSON.parse(storedValue);
        setValue(tags.join(", "));
        return;
      }
      setValue(storedValue);
    });
  }, []);
  return [value, setValue];
};

export const prepareContentForDB = (content: string) => {
  if (!content) return null;
  const parser = new DOMParser();
  const doc = parser.parseFromString(content, "text/html");
  const nodeList = doc.body.childNodes;
  const nodes = Array.from(nodeList);

  const data = nodes.map((node) => {
    const childs = node.childNodes;
    if (childs.length > 0 && node.childNodes[0].nodeName === "IMG") {
      const imageData = JSON.parse(node.childNodes[0].alt);
      return {
        type: "image",
        ...imageData,
      };
    }
    return {
      type: "text",
      data: node.innerHTML,
    };
  });

  return JSON.stringify(data);
};

export const saveChanges = (id: string, currentEditorState: string) => {
  const DBContent: string | null = prepareContentForDB(currentEditorState);
  console.log(DBContent);
  if (!DBContent || !currentEditorState) return;
  setPostField(id, "masterEditorState", currentEditorState);
  setPostField(id, "content", DBContent);
  setHasUnsavedChanges(id, false);
};

export const restoreBackup = async (id: string, callback?: Function) => {
  const masterEditorState = await getPostField(id, "masterEditorState");
  await setPostField(id, "draftEditorState", masterEditorState);

  if (typeof callback === "function") callback(masterEditorState);
};

export const useSaveBackup = (id: string) => {
  const [content, setContent] = useState(LOADING);
  const debouncedSave = useCallback(
    debounce((nextValue) => {
      console.log("saving backup");
      if (nextValue === LOADING) return;
      setPostContentBackup(id, nextValue);
    }, 1000),
    []
  );
  useEffect(() => {
    debouncedSave(content);
  }, [content]);
  useEffect(() => {
    getPostContentBackup(id).then((content) => {
      if (typeof content !== "string") return;
      setContent(content);
    });
  }, []);
  return [content, setContent];
};
