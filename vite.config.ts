import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import mkcert from "vite-plugin-mkcert";

// Set HTTPS=1 to enable a locally-trusted dev cert (required for WebXR on
// real devices). Plain `npm run dev` stays http. Use `npm run dev:https` or
// set HTTPS=1 in your shell.
const useHttps = process.env.HTTPS === "1";

export default defineConfig({
  plugins: [react(), ...(useHttps ? [mkcert()] : [])],
  server: {
    host: true,
    https: useHttps ? {} : undefined,
  },
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("react-router") || id.includes("/react/") || id.includes("/react-dom/"))
            return "react-vendor";
          if (id.includes("konva")) return "konva-vendor";
          if (
            id.includes("three") ||
            id.includes("@react-three") ||
            id.includes("meshline")
          )
            return "three-vendor";
          if (id.includes("jspdf") || id.includes("html2canvas") || id.includes("canvg") || id.includes("dompurify"))
            return "pdf-vendor";
        },
      },
    },
  },
});
