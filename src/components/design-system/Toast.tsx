import { ToastContainer, toast, Flip } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useDarkMode } from "@/providers/theme/Theme";
const Toast = () => {
  const { isDark } = useDarkMode();
  return (
    <ToastContainer
      autoClose={1000}
      closeOnClick
      draggable
      hideProgressBar
      newestOnTop={false}
      pauseOnFocusLoss={false}
      pauseOnHover
      position="top-right"
      rtl={false}
      theme={isDark ? "dark" : "light"}
      transition={Flip}
    />
  );
};

export { Toast, toast };
