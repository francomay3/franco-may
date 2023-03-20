import { ToastContainer, toast, Flip } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
const Toast = () => {
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
      theme="light"
      transition={Flip}
    />
  );
};

export { Toast, toast };
