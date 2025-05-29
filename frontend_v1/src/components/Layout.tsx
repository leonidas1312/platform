import React from "react";
import { SimpleVerticalNavbar } from "./SimpleVerticalNavbar";
import Footer from "./Footer";
import { motion, AnimatePresence } from "framer-motion";
import { SidebarProvider, SidebarInset } from "@/components/ui/simple-sidebar";

interface LayoutProps {
  children: React.ReactNode;
  hideNavbar?: boolean;
  useVerticalNav?: boolean;
  className?: string;
}

const Layout = ({ children, hideNavbar, useVerticalNav = true, className }: LayoutProps) => {
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

  // Use vertical sidebar layout
  if (useVerticalNav && !hideNavbar) {
    return (
      <SidebarProvider>
        <div className={`min-h-screen bg-background text-foreground antialiased ${className || ""}`}>
          <SimpleVerticalNavbar />
          <SidebarInset>
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
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }


};

export default Layout;
