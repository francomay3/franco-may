import Layout from "../Layout";
import dynamic from "next/dynamic";
import { useAuth } from "@/providers/AuthProvider";
// import RichTextArea from "./RichTextArea";
const RichTextArea = dynamic(() => import("./RichTextArea"), { ssr: false });

function LoggedIn() {
  const { logOut } = useAuth();
  return (
    <Layout>
      <p>logged in</p>
      <button onClick={() => logOut()}>sign out</button>
      <RichTextArea />
    </Layout>
  );
}

export default LoggedIn;
