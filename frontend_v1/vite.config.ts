import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  server: {
    host: "0.0.0.0",    // bind to all interfaces
    port: 8080,
    allowedHosts: ["rastion.com"],
    proxy: {
      "/api": {
        // Proxy into the ClusterIP service called "backend" on port 4000:
        target: "http://backend:4000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
