import { useAuth } from "@/providers/AuthProvider";
import LoggedIn from "@/components/pages/admin/LoggedIn";
import LoggedOut from "@/components/pages/admin/LoggedOut";
import NotAllowedUser from "@/components/pages/admin/NotAllowedUser";
import { Section } from "@/components/design-system";

const Admin = () => {
  // eslint-disable-next-line
  const { user, isAdmin, logIn, logOut } = useAuth();

  return (
    <Section>
      {!user && <LoggedOut />}
      {user && !isAdmin && <NotAllowedUser />}
      {user && isAdmin && <LoggedIn />}
    </Section>
  );
};

export default Admin;
