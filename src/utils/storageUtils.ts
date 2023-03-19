import {
  getStorage,
  ref,
  listAll,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import { IMAGES } from "./constants";
import { ImageData } from "./types";

export const uploadImage = async (file: File, name: string) => {
  await uploadBytes(ref(getStorage(), `${IMAGES}/${name}`), file);
  const url = await getDownloadURL(ref(getStorage(), `${IMAGES}/${name}`));
  return { url, name };
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
