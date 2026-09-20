import { defineConfig, type Plugin, type PreviewServer } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { randomUUID } from "node:crypto";

const BUILD_ID = `${Date.now().toString(36)}-${randomUUID().slice(0, 8)}`;

function cacheControlFor(url: string): string | null {
  const pathOnly = url.split("?")[0] || "/";
  if (pathOnly.startsWith("/assets/")) {
    return "public, max-age=31536000, immutable";
  }
  if (
    pathOnly === "/" ||
    pathOnly.endsWith(".html") ||
    pathOnly === "/version.json" ||
    pathOnly === "/sw.js" ||
    pathOnly === "/site.webmanifest"
  ) {
    return "no-cache, must-revalidate, max-age=0";
  }
  return null;
}

function applyPreviewCacheHeaders(server: PreviewServer) {
  server.middlewares.use((req, res, next) => {
    const value = cacheControlFor(req.url || "/");
    if (value) res.setHeader("Cache-Control", value);
    next();
  });
}

function buildIdPlugin(): Plugin {
  return {
    name: "swg-build-id",
    config() {
      return {
        define: {
          __SWG_BUILD_ID__: JSON.stringify(BUILD_ID),
        },
      };
    },
    generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: "version.json",
        source: JSON.stringify({ buildId: BUILD_ID }),
      });
    },
    configurePreviewServer(server) {
      applyPreviewCacheHeaders(server);
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
      "/uploads": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
  plugins: [react(), buildIdPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
