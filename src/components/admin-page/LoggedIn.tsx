import Layout from "../Layout";

import { useAuth } from "@/providers/AuthProvider";

function LoggedIn() {
  const { logOut } = useAuth();
  return (
    <Layout>
      <p>logged in</p>
      <button onClick={() => logOut()}>sign out</button>
    </Layout>
  );
}

export default LoggedIn;
