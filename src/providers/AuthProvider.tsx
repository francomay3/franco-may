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
  setIsEditing: (isEditing: boolean) => void;
  isEditing: boolean;
}>({
  user: null,
  isAdmin: false,
  logIn: () => Promise.resolve(undefined),
  logOut: () => Promise.resolve(false),
  setIsEditing: () => {},
  isEditing: false,
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
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setIsAdmin(
      process.env.NEXT_PUBLIC_ADMIN_UIDS?.split(",").includes(
        user?.uid || ""
      ) || false
    );
  }, [user]);

  return (
    <UserContext.Provider
      value={{
        user,
        isAdmin,
        logIn,
        logOut,
        setIsEditing: isAdmin ? setIsEditing : () => {},
        isEditing,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useAuth = () => {
  const { user, isAdmin, logIn, logOut, setIsEditing, isEditing } =
    useContext(UserContext);
  return { user, isAdmin, logIn, logOut, setIsEditing, isEditing };
};
