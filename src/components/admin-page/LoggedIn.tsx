import Layout from "../Layout";
import { useAuth } from "@/providers/AuthProvider";

function LoggedIn() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
