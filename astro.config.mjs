// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { loadEnv } from "vite";

const TRACKS_DIR = join(process.cwd(), "public", "tracks");
const CACHE_DIR = join(process.cwd(), ".cache", "tracks");
const VIDEO_ID_RE = /^[A-Za-z0-9_-]{11}$/;

// Env for the dev-only Turnstile gate. `.env*` is git-ignored; the values are
// ignored entirely in a production build (the plugin only runs in `serve`).
const env = loadEnv(
  process.env.NODE_ENV === "production" ? "production" : "development",
  process.cwd(),
  "",
);

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
 * - `/play/youtube/<id>`, `/play/ultrastar/<url>` and `/play/local` are
 *   rewritten to `/play` so the static page renders while the browser keeps the
 *   pretty URL;
 * - `/play/<id>` and `/play?v=<id>` redirect to `/play/youtube/<id>`;
 * - `/api/track/...` runs the real track handler.
 *
 * @param {Record<string, string>} env
 * @returns {import("vite").Plugin}
 */
function devServer(env) {
  return {
    name: "typestar-dev",
    apply: "serve",
    configureServer(server) {
      // Exercise the Turnstile gate locally when the test keys are in `.env`
      // (see the README). Without a secret, dev skips the check entirely.
      const turnstile = env.TURNSTILE_SECRET
        ? {
            secret: env.TURNSTILE_SECRET,
            hostnames: (env.TURNSTILE_HOSTNAMES ?? "localhost")
              .split(",")
              .map((hostname) => hostname.trim())
              .filter(Boolean),
            action: "track",
          }
        : undefined;

      server.middlewares.use((req, res, next) => {
        const [path, query = ""] = (req.url ?? "").split("?");

        if (path === "/play") {
          const video = new URLSearchParams(query).get("v");
          if (video && VIDEO_ID_RE.test(video)) {
            res.statusCode = 301;
            res.setHeader("location", `/play/youtube/${video}`);
            res.end();
            return;
          }
        }

        // Legacy `/play/<id>` -> `/play/youtube/<id>`.
        const legacy = /^\/play\/([A-Za-z0-9_-]{11})\/?$/.exec(path);
        if (legacy) {
          res.statusCode = 301;
          res.setHeader("location", `/play/youtube/${legacy[1]}`);
          res.end();
          return;
        }

        if (
          path === "/play/local" ||
          path === "/play/local/" ||
          /^\/play\/youtube\/[^/]+\/?$/.test(path) ||
          /^\/play\/ultrastar\/.+\/?$/.test(path)
        ) {
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
          const sourceModule = /** @type {typeof import("./src/lib/track/source")} */ (
            await server.ssrLoadModule("/src/lib/track/source.ts")
          );

          const url = new URL(`http://localhost${req.url ?? ""}`);
          const source = sourceModule.apiSourceFromRequest(
            url.pathname,
            url.searchParams,
          );
          if (!source) {
            res.statusCode = 400;
            res.setHeader("content-type", "application/json");
            res.end(JSON.stringify({ error: "bad-request" }));
            return;
          }

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
            { store: fileStore(), seed, turnstile },
            source,
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
    plugins: [tailwindcss(), devServer(env)],
  },
});
