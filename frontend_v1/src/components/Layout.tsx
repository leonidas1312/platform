import React from "react";
import { VerticalNavbar } from "./VerticalNavbar";
import Footer from "./Footer";
import { motion, AnimatePresence } from "framer-motion";

interface LayoutProps {
  children: React.ReactNode;
  hideNavbar?: boolean;
  className?: string;
}

const Layout = ({ children, hideNavbar, className }: LayoutProps) => {
  const pageVariants = {
    initial: {
      opacity: 0,
      y: 20,
      scale: 0.98,
    },
    in: {
      opacity: 1,
      y: 0,
      scale: 1,
    },
    out: {
      opacity: 0,
      y: -20,
      scale: 1.02,
    },
  };

  const pageTransition = {
    type: "tween",
    ease: [0.25, 0.25, 0, 1],
    duration: 0.6,
  };

  // Use new horizontal navbar layout (default)
  if (!hideNavbar) {
    return (
      <div className={`min-h-screen bg-background text-foreground antialiased ${className || ""}`}>
        <VerticalNavbar />
        <AnimatePresence mode="wait">
          <motion.main
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
            className="flex-grow relative min-h-screen"
          >
            {children}
          </motion.main>
        </AnimatePresence>
        <Footer />
      </div>
    );
  }

  // Fallback layout without navbar
  return (
    <div className={`min-h-screen bg-background text-foreground antialiased ${className || ""}`}>
      <AnimatePresence mode="wait">
        <motion.main
          initial="initial"
          animate="in"
          exit="out"
          variants={pageVariants}
          transition={pageTransition}
          className="flex-grow relative"
        >
          {children}
        </motion.main>
      </AnimatePresence>
      <Footer />
    </div>
  );
};

export default Layout;
