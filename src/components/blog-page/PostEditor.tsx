import { useAuth } from "@/providers/AuthProvider";
import RichTextArea from "../admin-page/RichTextArea";
import { saveChanges, useSaveBackup } from "./utils";
import { publishPost, unpublishPost } from "@/utils";

function PostEditor({ id }) {
  const { logOut } = useAuth();
  const [content, setContent] = useSaveBackup(id);
  return (
    <>
      <p>signed in</p>
      <button onClick={() => logOut()}>sign out</button>
      <RichTextArea value={content} setValue={setContent} />
      <button onClick={() => publishPost(id)}>publish post</button>
      <button onClick={() => unpublishPost(id)}>unpublish post</button>
      <button onClick={() => saveChanges(id, content)}>save changes</button>
    </>
  );
}

export default PostEditor;
