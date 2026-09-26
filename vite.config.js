import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Production source maps stay disabled so source files are not published alongside the app.
export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: false,
  },
});
