import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

const temp = () => {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <div>
      <button onClick={() => setIsOpen((prev) => !prev)}>toggle</button>
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
