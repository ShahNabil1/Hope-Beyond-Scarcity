import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ command }) => ({
  plugins: [
    tailwindcss(),
    tsconfigPaths({ projects: ["./tsconfig.json"] }),
    tanstackStart({
      server: { entry: "server" },
      importProtection: {
        behavior: "error",
        client: { files: ["**/server/**"], specifiers: ["server-only"] },
      },
    }),
    command === "build" && nitro({ defaultPreset: "cloudflare-module" }),
    react(),
  ],
  css: { transformer: "lightningcss" },
  resolve: {
    alias: [
      // Use the ESM helpers so pdf-lib can load in the Worker SSR bundle.
      { find: /^tslib$/, replacement: "tslib/tslib.es6.js" },
      { find: /^tslib\/modules(\/index\.js)?$/, replacement: "tslib/tslib.es6.js" },
    ],
    dedupe: ["react", "react-dom", "@tanstack/react-query", "@tanstack/query-core"],
  },
  server: { host: "::", port: 8080 },
}));
