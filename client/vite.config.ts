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
      "@game": path.resolve(__dirname, "../game/"),
    },
    dedupe: ["pixi.js", "matter-js", "colyseus.js", "gl-matrix"],
  },

  build: {
    target: "es2020",
    minify: true,
  },
});
