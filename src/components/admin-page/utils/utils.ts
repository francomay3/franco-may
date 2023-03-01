import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { debounce } from "lodash";
import { useCallback, useEffect, useMemo } from "react";

export const uploadImage = async (file: File, title: string) => {
  await uploadBytes(ref(getStorage(), `images/${title}`), file);
  const url = await getDownloadURL(ref(getStorage(), `images/${title}`));
  return url;
};

export const prepareContentForDB = (content: string) => {
  if (!content) return [];
  const replace = (str: string) => {
    const regex = /<p><a.*?href="(.*?)".*?>(.*?)<\/a><\/p>/g;
    return str.replace(regex, (match, imageName, caption) => {
      return `IMAGESTART${JSON.stringify({ imageName, caption })}IMAGEEND`;
    });
  };
  const split = (str: string) => {
    const regex = /IMAGESTART(.*?)IMAGEEND/g;
    return str.split(regex);
  };
  const replaced = replace(content);
  const splitted = split(replaced);
  return splitted.map((segment) => {
    try {
      const parsedSegment = JSON.parse(segment);
      if (parsedSegment.imageName && parsedSegment.caption) {
        return { type: "image", ...parsedSegment };
      }
    } catch (error) {
      return { type: "text", content: segment };
    }
  });
};

export const useSaveToDB = (value: string) => {
  const debouncedSave = useCallback(
    debounce((nextValue) => {
      const DBContent = prepareContentForDB(nextValue);
      // TODO: send the content to the DB.
    }, 1000),
    []
  );
  useEffect(() => {
    debouncedSave(value);
  }, [value]);
};

export default useSaveToDB;
