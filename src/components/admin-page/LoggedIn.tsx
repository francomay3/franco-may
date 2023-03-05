import Layout from "../Layout";
import dynamic from "next/dynamic";
import { useAuth } from "@/providers/AuthProvider";

function LoggedIn() {
  const { logOut, user } = useAuth();
  return (
    <Layout>
      <p>signed in</p>
      <button onClick={() => logOut()}>sign out</button>
      <button>New post</button>
    </Layout>
  );
}

export default LoggedIn;
