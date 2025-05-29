import React from "react";
import { motion } from "framer-motion";

interface LoadingProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  fullScreen?: boolean;
}

const Loading = ({ size = "md", text = "Loading...", fullScreen = true }: LoadingProps) => {
  const sizeMap = {
    sm: { width: "32", height: "32", blur: "blur-2xl" },
    md: { width: "48", height: "48", blur: "blur-3xl" },
    lg: { width: "64", height: "64", blur: "blur-3xl" }
  };

  const currentSize = sizeMap[size];

  return (
    <div className={`flex flex-col items-center justify-center ${fullScreen ? "min-h-screen" : "p-8"}`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.25, 0.25, 0, 1] }}
        className="relative"
      >
        <div className="absolute -inset-10 opacity-30">
          <div className={`w-full h-full bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-cyan-500/30 ${currentSize.blur} rounded-full`}></div>
        </div>

        <div className="relative">
          <svg
            width={currentSize.width}
            height={currentSize.height}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-foreground"
          >
            <motion.path
              d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2Z"
              stroke="url(#gradient)"
              strokeWidth="2"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{
                duration: 2,
                ease: "easeInOut",
                repeat: Infinity,
              }}
            />
            <motion.circle
              cx="12"
              cy="12"
              r="3"
              fill="url(#centerGradient)"
              initial={{ scale: 0.8, opacity: 0.5 }}
              animate={{ scale: 1.2, opacity: 1 }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut",
              }}
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="50%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
              <radialGradient id="centerGradient" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.4" />
              </radialGradient>
            </defs>
          </svg>
        </div>
      </motion.div>

      {text && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-6 text-muted-foreground font-medium text-sm"
        >
          {text}
        </motion.p>
      )}
    </div>
  );
};

export default Loading;
