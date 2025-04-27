import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      // any request that starts with /api will be proxied to http://localhost:4000
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
        secure: false,
        // if your backend routes don’t actually have the /api prefix,
        // you can strip it before forwarding:
        // rewrite: (path) => path.replace(/^\/api/, "")
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
