import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { toast } from "@/components/design-system/Toast";

const functionThatReturnPromise = () =>
  new Promise((resolve) => setTimeout(resolve, 3000));
toast.promise(functionThatReturnPromise, {
  pending: "Promise is pending",
  success: "Promise resolved 👌",
  error: "Promise rejected 🤯",
});
const temp = () => {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <div>
      <button onClick={() => setIsOpen((prev) => !prev)}>
        toggle animation
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: "-10%" }}
            animate={{ opacity: 1, y: "0%" }}
            exit={{ opacity: 0, y: "10%" }}
            transition={{ duration: 0.2 }}
            key="mobile-nav"
          >
            <h1>hello</h1>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default temp;
