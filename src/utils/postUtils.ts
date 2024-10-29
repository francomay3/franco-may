import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
  addDoc,
} from "firebase/firestore";
import {
  AUTHOR,
  COMMENTS,
  CONTENT,
  CREATED_AT,
  DESCRIPTION,
  IMAGE,
  LOCATION,
  POSTS,
  PUBLISHED,
  SLUG,
  TAGS,
  TITLE,
  UPDATED_AT,
} from "./constants";
import { PostFields } from "./types";
import { toast } from "@/components/design-system";
import { db } from "@/config/firebase-client";
import {
  ImageBlockDataDefault,
  TextBlockDataDefault,
} from "@/components/pages/post/connectedFields/content/blocks";

// READ

export const getPosts = async () => {
  const postsCol = collection(db, POSTS);
  const postsSnapshot = await getDocs(postsCol);
  const posts = postsSnapshot.docs.map((doc) => doc.data());
  return posts;
};

export const getPost = async (slug: string) => {
  const postDoc = doc(db, POSTS, slug);
  const postSnapshot = await getDoc(postDoc);
  const commentsRef = collection(postDoc, COMMENTS);
  const commentsSnapshot = await getDocs(commentsRef);
  const comments = commentsSnapshot.docs.map((doc) => doc.data());
  const post = { ...postSnapshot.data(), comments };
  return post;
};

export const getPostSlugs = async () => {
  const postsCol = collection(db, POSTS);
  const postsSnapshot = await getDocs(postsCol);
  const postSlugs = postsSnapshot.docs.map((doc) => doc.id);
  return postSlugs;
};

export const getPostsByTag = async (tag: string) => {
  const postsCol = collection(db, POSTS);
  const q = query(postsCol, where(TAGS, "array-contains", tag));
  const postsSnapshot = await getDocs(q);
  const posts = postsSnapshot.docs.map((doc) => doc.data());
  return posts;
};

// WRITE

export const createPost = async (slug: string) => {
  try {
    const postSlugs = await getPostSlugs();
    if (postSlugs.includes(slug)) {
      toast.error("Post already exists");
      return false;
    }
    // eslint-disable-next-line no-empty
  } catch (e: any) {}
  const logic = async () => {
    const startingValue: Omit<PostFields, typeof COMMENTS> = {
      [CONTENT]: [
        { ...TextBlockDataDefault, blockId: 1 },
        { ...ImageBlockDataDefault, blockId: 2 },
        { ...TextBlockDataDefault, blockId: 3 },
      ],
      [CREATED_AT]: new Date().getTime(),
      [UPDATED_AT]: new Date().getTime(),
      [DESCRIPTION]: "Blog Description",
      [LOCATION]: "Göteborg, Sverige",
      [PUBLISHED]: false,
      [TAGS]: ["Tag1", "Tag2"],
      [TITLE]: slug,
      [AUTHOR]: "Franco May",
      [SLUG]: slug,
      [IMAGE]: "https://source.unsplash.com/random/800x600",
    };

    const initialComment = {
      name: "Franco May",
      date: new Date().getTime(),
      content: "It feels kinda lonely here... Could you leave a comment?",
    };

    try {
      const postDoc = doc(db, POSTS, slug);
      await setDoc(postDoc, startingValue);

      const commentsRef = collection(postDoc, COMMENTS);
      await addDoc(commentsRef, initialComment);

      return true;
    } catch (error: any) {
      return { error };
    }
  };
  return toast.promise(logic(), {
    pending: "creating Post...",
    success: "Post created",
    error: "Error creating Post",
  });
};

export const deletePost = async (slug: string) => {
  const logic = async () => {
    try {
      const postDoc = doc(db, POSTS, slug);
      await deleteDoc(postDoc);
      return true;
    } catch (error: any) {
      return { error };
    }
  };
  return toast.promise(logic(), {
    pending: "deleting Post...",
    success: "Post deleted",
    error: "Error deleting Post",
  });
};

export const setPostField = async (slug: string, field: string, value: any) => {
  const logic = async () => {
    try {
      const postDoc = doc(db, POSTS, slug);
      await setDoc(postDoc, { [field]: value }, { merge: true });
      return true;
    } catch (error: any) {
      return { error };
    }
  };
  return toast.promise(logic(), {
    pending: `updating ${field}...`,
    success: `${field} updated!`,
    error: `Error updating ${field}`,
  });
};

export const updatePost = async (slug: string, data: any) => {
  const logic = async () => {
    try {
      const postDoc = doc(db, POSTS, slug);
      await setDoc(postDoc, data);
      return true;
    } catch (error: any) {
      return { error };
    }
  };
  return toast.promise(logic(), {
    pending: "Saving changes...",
    success: "Post updated!",
    error: "Error updating Post",
  });
};

export const createComment = async (slug: string, comment: any) => {
  const logic = async () => {
    try {
      const postDoc = doc(db, POSTS, slug);
      const commentsRef = collection(postDoc, COMMENTS);
      await addDoc(commentsRef, comment);
      return true;
    } catch (error: any) {
      return { error };
    }
  };
  return toast.promise(logic(), {
    pending: "Saving comment...",
    success: {
      render: "Thank you for your comment! 😃",
      autoClose: 3000,
    },
    error: "Error saving comment 🤔",
  });
};

export const deleteComment = async (slug: string, date: number) => {
  const logic = async () => {
    try {
      const postDoc = doc(db, POSTS, slug);
      const commentsRef = collection(postDoc, COMMENTS);
      const q = query(commentsRef, where("date", "==", date));
      const commentsSnapshot = await getDocs(q);
      const commentId = commentsSnapshot.docs[0].id;
      await deleteDoc(doc(commentsRef, commentId));
      return true;
    } catch (error: any) {
      return { error };
    }
  };
  return toast.promise(logic(), {
    pending: "Deleting comment...",
    success: "Comment deleted!",
    error: "Error deleting comment",
  });
};
