import { useAuth } from "@/providers/AuthProvider";
import LoggedIn from "@/components/admin-page/LoggedIn";
import LoggedOut from "@/components/admin-page/LoggedOut";
import NotAllowedUser from "@/components/admin-page/NotAllowedUser";

const Admin = () => {
  const { user, isAdmin, logIn, logOut } = useAuth();

  return (
    <>
      {!user && <LoggedOut />}
      {user && !isAdmin && <NotAllowedUser />}
      {user && isAdmin && <LoggedIn />}
    </>
  );
};

export default Admin;
