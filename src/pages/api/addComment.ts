import { ref, get, set } from "firebase/database";
import { POSTS } from "@/utils/constants";
import { db } from "@/firebase";

type Req = {
  body: {
    comment: string;
    slug: string;
  };
};

type Res = {
  status: (code: number) => Res;
  json: (data: { status: string }) => void;
};

async function addComment(req: Req, res: Res) {
  const { comment, slug } = req.body;
  const dbRef = ref(db, `${POSTS}/${slug}/comments`);
  const snapshot = await get(dbRef);
  const comments = snapshot.val();
  const newComments = [...comments, comment];
  await set(dbRef, newComments);
  res.status(200).json({ status: "success" });
}

export default addComment;
