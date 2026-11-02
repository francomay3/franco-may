import { getBytes, ref } from 'firebase/storage';
import { storage } from './firebase';
import type { Area, Dataset, Video } from './types';

/**
 * getBytes and not getDownloadURL, on purpose. A download URL carries its own
 * token and bypasses the storage rules, so one leaked URL would hand out
 * YouTube data to anyone. getBytes goes through the rules every time.
 */
export async function loadDataset(): Promise<Dataset> {
  const [videosBuf, embBuf] = await Promise.all([
    getBytes(ref(storage, 'hackertube/videos.json')),
    getBytes(ref(storage, 'hackertube/embeddings.i8')),
  ]);
  const parsed = JSON.parse(new TextDecoder().decode(videosBuf)) as {
    taxonomy: Area[];
    videos: Video[];
  };
  return {
    areas: parsed.taxonomy,
    videos: parsed.videos,
    embeddings: new Int8Array(embBuf),
  };
}
