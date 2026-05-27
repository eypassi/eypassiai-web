import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    allowedHosts: ["eypassiai.com", "www.eypassiai.com", "app.eypassiai.com"],
  },
  preview: {
    host: "0.0.0.0",
    allowedHosts: ["eypassiai.com", "www.eypassiai.com", "app.eypassiai.com"],
  },
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        app: "app/index.html",
        privacy: "privacy.html",
        terms: "terms.html",
      },
    },
  },
});
