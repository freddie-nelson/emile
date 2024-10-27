import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src/"),
      "@state": path.resolve(__dirname, "../state/"),
      "@shared": path.resolve(__dirname, "../shared/"),
      "@engine": path.resolve(__dirname, "../engine/"),
    },
  },

  build: {
    target: "es2020",
    minify: "esbuild",
  },

  esbuild: {
    minifyIdentifiers: false,
  },
});
