import { db } from "@/firebase";
import { ref, get, set } from "firebase/database";
import { debounce } from "lodash";
import { useCallback, useEffect, useState } from "react";
import {
  DRAFT_EDITOR_STATE,
  HAS_UNSAVED_CHANGES,
  LOADING,
  SAVED_EDITOR_STATE,
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
} from "./constants";

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

export const useSetDebouncedPostField = (id: string, postField: string) => {
  const [value, setValue] = useState(LOADING);

  const debouncedSave = useCallback(
    debounce((nextValue) => {
      if (nextValue === LOADING) return;
      if (postField === TAGS) {
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
      if (postField === TAGS) {
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
  setPostField(id, SAVED_EDITOR_STATE, currentEditorState);
  setPostField(id, CONTENT, DBContent);
  setPostField(id, HAS_UNSAVED_CHANGES, false);
};

export const restoreBackup = async (id: string, callback?: Function) => {
  const masterEditorState = await getPostField(id, SAVED_EDITOR_STATE);
  await setPostField(id, DRAFT_EDITOR_STATE, masterEditorState);

  if (typeof callback === "function") callback(masterEditorState);
};

export const useSaveBackup = (id: string) => {
  const [content, setContent] = useState(LOADING);
  const debouncedSave = useCallback(
    debounce((nextValue) => {
      if (nextValue === LOADING) return;
      setPostField(id, DRAFT_EDITOR_STATE, nextValue);
      setPostField(id, HAS_UNSAVED_CHANGES, true);
    }, 1000),
    []
  );
  useEffect(() => {
    debouncedSave(content);
  }, [content]);
  useEffect(() => {
    getPostField(id, DRAFT_EDITOR_STATE).then((content) => {
      if (typeof content !== "string") return;
      setContent(content);
    });
  }, []);
  return [content, setContent];
};

export const createPost = async (id: any) => {
  // check if id is already taken
  const postIds = await getPostIds();
  if (postIds.includes(id)) {
    return false;
  }
  // create post
  const value = {
    [CONTENT]: "content",
    [CREATED_AT]: new Date().getTime(),
    [UPDATED_AT]: new Date().getTime(),
    [DESCRIPTION]: "description",
    [DRAFT_EDITOR_STATE]: "",
    [SAVED_EDITOR_STATE]: "",
    [HAS_UNSAVED_CHANGES]: false,
    [LOCATION]: "",
    [PUBLISHED]: false,
    [TAGS]: "",
    [TITLE]: "",
    [AUTHOR]: "",
  };

  set(ref(db, `${POSTS}/${id}`), value);
  return true;
};
