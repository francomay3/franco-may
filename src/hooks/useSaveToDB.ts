import { debounce } from "lodash";
import { useCallback, useEffect } from "react";

const prepareContentForDB = (content: string) => {
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

const useSaveToDB = (value: string) => {
  const debouncedSave = useCallback(
    debounce((nextValue) => {
      const content = prepareContentForDB(nextValue);
      // TODO: send the content to the DB.
    }, 1000),
    []
  );
  useEffect(() => {
    debouncedSave(value);
  }, [value]);
};

export default useSaveToDB;
