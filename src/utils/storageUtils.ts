import {
  getStorage,
  ref,
  listAll,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import { IMAGES } from "./constants";

export const uploadImage = async (file: File, title: string) => {
  await uploadBytes(ref(getStorage(), `${IMAGES}/${title}`), file);
  const url = await getDownloadURL(ref(getStorage(), `${IMAGES}/${title}`));
  return url;
};

export type ImageData = {
  url: string;
  name: string;
};

export const getImages = async () => {
  const list = await listAll(ref(getStorage(), IMAGES));
  const images: ImageData[] = await Promise.all(
    list.items.map(async (item) => {
      const url = await getDownloadURL(item);
      const name = item.name;
      return { url, name };
    })
  );
  return images;
};
