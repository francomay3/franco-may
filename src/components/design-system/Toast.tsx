import { ToastContainer, toast, Flip } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
const Toast = () => {
  return (
    <ToastContainer
      position="top-right"
      autoClose={1000}
      hideProgressBar
      newestOnTop={false}
      closeOnClick
      rtl={false}
      pauseOnFocusLoss={false}
      draggable
      pauseOnHover
      theme="light"
      transition={Flip}
    />
  );
};

export { Toast, toast };
