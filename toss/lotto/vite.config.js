import { defineConfig } from "vite";

// web/ (prepare.mjs 가 만든 화면) → dist/ (앱 묶음 재료)
export default defineConfig({
  root: "web",
  base: "./",
  build: { outDir: "../dist", emptyOutDir: true, assetsInlineLimit: 0 },
});
