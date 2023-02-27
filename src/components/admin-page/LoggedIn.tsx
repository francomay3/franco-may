import Layout from "../Layout";
import { useAuth } from "@/providers/AuthProvider";
import RichTextArea from "./RichTextArea";

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
