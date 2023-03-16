import {
  createContext,
  useEffect,
  useState,
  useContext,
  ReactNode,
} from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { signInWithPopup, User, UserCredential } from "firebase/auth";
import { auth, provider } from "@/firebase";

export const UserContext = createContext<{
  user: User | null | undefined;
  isAdmin: boolean;
  logIn: () => Promise<UserCredential | undefined>;
  logOut: () => Promise<boolean>;
}>({
  user: null,
  isAdmin: false,
  logIn: () => Promise.resolve(undefined),
  logOut: () => Promise.resolve(false),
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const logIn = async () => {
    try {
      const user = await signInWithPopup(auth, provider);
      return user;
    } catch (error) {
      return undefined;
    }
  };
  const logOut = async () => {
    try {
      await auth.signOut();
      return true;
    } catch (error) {
      return false;
    }
  };
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

export const useAuth = () => {
  const { user, isAdmin, logIn, logOut } = useContext(UserContext);
  return { user, isAdmin, logIn, logOut };
};
