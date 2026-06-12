import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    tsconfigPaths(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "inline",
      strategies: "generateSW", // 👈 CHANGED from injectManifest so it auto-creates the service worker

      pwaAssets: {
        disabled: false,
        config: true,
      },

      manifest: {
        name: "Attendance Tracker",
        short_name: "Attendify",
        description: "Track and optimize your class attendance schedules.",
        theme_color: "#800080",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "portrait",
        icons: [
          {
            src: "android-chrome-192x192.png", // 👈 CHANGED: Ensure this file is a real 192x192px PNG in your /public folder
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "android-chrome-512x512.png", // 👈 CHANGED: Ensure this file is a real 512x512px PNG in your /public folder
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico}"],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
      },

      devOptions: {
        enabled: true,
        navigateFallback: "index.html",
        suppressWarnings: true,
        type: "module",
      },
    }),
  ],
});
