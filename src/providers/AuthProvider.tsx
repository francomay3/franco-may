import { createContext, useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { signInWithPopup, User } from "firebase/auth";
import { auth, provider } from "@/firebase";
// import firebase types

export const UserContext = createContext<{
  user: User | null | undefined;
  isAdmin: boolean;
  logIn: Function;
  logOut: Function;
}>({
  user: null,
  isAdmin: false,
  logIn: () => {},
  logOut: () => {},
});
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const logIn = async () => {
    await signInWithPopup(auth, provider);
  };
  const logOut = () => auth.signOut();
  const [user] = useAuthState(auth);
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    setIsAdmin(user?.email === "francomay3@gmail.com");
  }, [user]);
  return (
    <UserContext.Provider value={{ user, isAdmin, logIn, logOut }}>
      {children}
    </UserContext.Provider>
  );
};

import { useContext } from "react";

export const useAuth = () => {
  const { user, isAdmin, logIn, logOut } = useContext(UserContext);
  return { user, isAdmin, logIn, logOut };
};
