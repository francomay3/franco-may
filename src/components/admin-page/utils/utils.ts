import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

export const uploadImage = async (file: File, title: string) => {
  await uploadBytes(ref(getStorage(), `images/${title}`), file);
  const url = await getDownloadURL(ref(getStorage(), `images/${title}`));
  return url;
};
