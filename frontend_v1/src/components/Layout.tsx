import React from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { motion } from "framer-motion";

interface LayoutProps {
  children: React.ReactNode;
  hideNavbar?: boolean;
}

const Layout = ({ children, hideNavbar }: LayoutProps) => {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {!hideNavbar && <Navbar />}
      <motion.main 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex-grow pb-20"
      >
        {children}
      </motion.main>
      <Footer />
    </div>
  );
};

export default Layout;
