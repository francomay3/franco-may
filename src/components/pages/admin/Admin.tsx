import { useAuth } from "@/providers/AuthProvider";
import LoggedIn from "@/components/pages/admin/LoggedIn";
import LoggedOut from "@/components/pages/admin/LoggedOut";
import NotAllowedUser from "@/components/pages/admin/NotAllowedUser";

const Admin = () => {
  // eslint-disable-next-line
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
