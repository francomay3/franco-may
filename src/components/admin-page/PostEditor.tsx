import Layout from "../Layout";
import dynamic from "next/dynamic";
import { useAuth } from "@/providers/AuthProvider";
const RichTextArea = dynamic(() => import("./RichTextArea"), { ssr: false });

function PostEditor() {
  const { logOut } = useAuth();
  return (
    <Layout
      contentStyles={{ alignItems: "stretch", justifyContent: "flex-start" }}
    >
      <p>signed in</p>
      <button onClick={() => logOut()}>sign out</button>
      <RichTextArea />
    </Layout>
  );
}

export default PostEditor;
