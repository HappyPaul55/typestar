// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const TRACKS_DIR = join(process.cwd(), "public", "tracks");
const CACHE_DIR = join(process.cwd(), ".cache", "tracks");
const VIDEO_ID_RE = /^[A-Za-z0-9_-]{11}$/;

/**
 * A filesystem `TrackStore` for `astro dev`, plus a seed reader that mirrors the
 * Worker's asset-backed seed. Keeps local development running without Wrangler
 * or R2, while using the exact same API handler as production.
 *
 * @returns {import("./src/lib/track/store").TrackStore}
 */
function fileStore() {
  return {
    async get(key) {
      try {
        return await readFile(join(CACHE_DIR, key), "utf8");
      } catch {
        return null;
      }
    },
    async put(key, value) {
      const file = join(CACHE_DIR, key);
      await mkdir(dirname(file), { recursive: true });
      await writeFile(file, value, "utf8");
    },
  };
}

/**
 * Dev-only middleware that reproduces the Worker's routing:
 * - `/play/<id>` is rewritten to `/play` so the static page renders while the
 *   browser keeps the pretty URL;
 * - `/play?v=<id>` redirects to `/play/<id>`;
 * - `/api/track/:id` runs the real track handler.
 *
 * @returns {import("vite").Plugin}
 */
function devServer() {
  return {
    name: "typestar-dev",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const [path, query = ""] = (req.url ?? "").split("?");

        if (path === "/play") {
          const video = new URLSearchParams(query).get("v");
          if (video && VIDEO_ID_RE.test(video)) {
            res.statusCode = 301;
            res.setHeader("location", `/play/${video}`);
            res.end();
            return;
          }
        }

        if (/^\/play\/[A-Za-z0-9_-]{11}\/?$/.test(path)) {
          req.url = "/play";
          next();
          return;
        }

        next();
      });

      server.middlewares.use(async (req, res, next) => {
        const path = (req.url ?? "").split("?")[0];
        if (!path.startsWith("/api/track/")) {
          next();
          return;
        }

        try {
          const api = /** @type {typeof import("./src/lib/tracks-api")} */ (
            await server.ssrLoadModule("/src/lib/tracks-api.ts")
          );
          const id = decodeURIComponent(path.slice("/api/track/".length)).replace(/\/+$/, "");

          /** @param {string} seedId @param {string} lang */
          const seed = async (seedId, lang) => {
            if (lang !== "en") return null;
            try {
              return await readFile(join(TRACKS_DIR, `${seedId}.json`), "utf8");
            } catch {
              return null;
            }
          };

          const request = new Request(`http://localhost${req.url ?? ""}`, {
            method: req.method,
            headers: { accept: req.headers.accept ?? "application/json" },
          });

          const response = await api.handleTrackRequest(
            request,
            { store: fileStore(), seed },
            id,
          );

          res.statusCode = response.status;
          response.headers.forEach((value, key) => res.setHeader(key, value));
          res.end(await response.text());
        } catch (error) {
          server.config.logger.error(
            `[dev-api] ${error instanceof Error ? error.message : String(error)}`,
          );
          res.statusCode = 500;
          res.setHeader("content-type", "application/json");
          res.end(JSON.stringify({ error: "dev-api-failed" }));
        }
      });
    },
  };
}

export default defineConfig({
  site: "https://typestar.happypaul55.com",
  build: {
    format: "file",
    inlineStylesheets: "always",
  },
  trailingSlash: "never",
  integrations: [sitemap(), react()],
  vite: {
    plugins: [tailwindcss(), devServer()],
  },
});
