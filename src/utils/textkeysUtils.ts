import { ref, get, set } from "firebase/database";
import { toast } from "@/components/design-system";
import { db } from "@/firebase";

const TEXTKEYS = "textkeys";

export async function getServerSideTexts() {
  try {
    const textkeys = await getTextkeys();
    return {
      props: {
        textkeys,
      },
    };
  } catch (error) {
    return { props: { textkeys: {} } };
  }
}

export const getTextkeys = async () => {
  const dbRef = ref(db, "textkeys");
  const snapshot = await get(dbRef);
  const rawTextkeys = snapshot.val();
  return rawTextkeys;
};

export const getTextkey = async (key: string) => {
  const dbRef = ref(db, `${TEXTKEYS}/${key}`);
  try {
    const snapshot = await get(dbRef);
    return snapshot.val();
  } catch (e: any) {
    throw new Error(e.message);
  }
};

export const setTextkey = async (key: string, value: string) => {
  return toast.promise(set(ref(db, `${TEXTKEYS}/${key}`), value), {
    pending: "updating Textkey...",
    success: "Textkey updated",
    error: "Error updating Textkey",
  });
};
