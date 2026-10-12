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
// The dev-only Better Auth database (see `src/lib/auth/dev.ts`).
const AUTH_DB = join(process.cwd(), ".cache", "auth.sqlite");
const VIDEO_ID_RE = /^[A-Za-z0-9_-]{11}$/;

// Dev-only fallback secret for Better Auth. Production uses the
// `BETTER_AUTH_SECRET` Worker secret; this only needs to be stable so a local
// session survives a hot reload.
const DEV_AUTH_SECRET = "typestar-dev-only-insecure-secret-change-me";

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
 * Read a pre-warmed seed track from `public/tracks/`, mirroring the Worker's
 * asset-backed seed. Only the default language is bundled.
 * @param {string} seedId
 * @param {string} lang
 */
async function readSeed(seedId, lang) {
  if (lang !== "en") return null;
  try {
    return await readFile(join(TRACKS_DIR, `${seedId}.json`), "utf8");
  } catch {
    return null;
  }
}

/**
 * Read a Node request body into a Buffer, or `undefined` when empty.
 * @param {import("node:http").IncomingMessage} req
 */
async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return chunks.length ? Buffer.concat(chunks) : undefined;
}

/**
 * Build a Web `Request` from a Node request, preserving headers and body.
 * @param {import("node:http").IncomingMessage} req
 * @param {string} url
 * @param {Buffer | undefined} body
 */
function toWebRequest(req, url, body) {
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) for (const item of value) headers.append(key, item);
    else if (value !== undefined) headers.set(key, value);
  }
  // Better Auth's rate limiter reads the client address.
  if (!headers.has("x-forwarded-for") && req.socket?.remoteAddress) {
    headers.set("x-forwarded-for", req.socket.remoteAddress);
  }
  const method = req.method ?? "GET";
  const hasBody = method !== "GET" && method !== "HEAD";
  const requestBody = hasBody && body ? new Uint8Array(body) : undefined;
  return new Request(url, { method, headers, body: requestBody });
}

/**
 * Write a Web `Response` back to the Node response, preserving `set-cookie`
 * (which `Headers.forEach` would otherwise collapse).
 * @param {import("node:http").ServerResponse} res
 * @param {Response} response
 */
async function sendWebResponse(res, response) {
  res.statusCode = response.status;
  for (const [key, value] of response.headers) {
    if (key.toLowerCase() === "set-cookie") continue;
    res.setHeader(key, value);
  }
  const cookies =
    typeof response.headers.getSetCookie === "function"
      ? response.headers.getSetCookie()
      : [];
  if (cookies.length) res.setHeader("set-cookie", cookies);
  res.end(Buffer.from(await response.arrayBuffer()));
}

/**
 * Dev-only middleware that reproduces the Worker's routing:
 * - `/play/youtube/<id>`, `/play/ultrastar/<url>` and `/play/local` are
 *   rewritten to `/play` so the static page renders while the browser keeps the
 *   pretty URL;
 * - `/play/<id>` and `/play?v=<id>` redirect to `/play/youtube/<id>`;
 * - `/api/track/...` runs the real track handler.
 * - `/api/auth/...` runs the real Better Auth handler on a local SQLite DB.
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

        // A public profile at `/u/<handle>` renders the `/u` page.
        if (path === "/u" || /^\/u\/[^/]+\/?$/.test(path)) {
          req.url = "/u";
          next();
          return;
        }

        // The embed widget at `/embed/...` renders the `/embed` page.
        if (path === "/embed" || /^\/embed\//.test(path)) {
          req.url = "/embed";
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

          const seed = readSeed;

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

      // Dev-only accounts. Better Auth runs against a file-backed SQLite
      // database (so a session survives a hot reload) and logs the magic link
      // to the console instead of emailing it. The handler is the same one the
      // Worker mounts, so `/api/auth/*` behaves identically.
      /** @type {Promise<any> | null} */
      let devAuthPromise = null;
      const getDevAuth = () => {
        devAuthPromise ??= (async () => {
          const dev = await server.ssrLoadModule("/src/lib/auth/dev.ts");
          const { createAuth } = await server.ssrLoadModule(
            "/src/lib/auth/server.ts",
          );
          const db = dev.createDevDatabase(AUTH_DB);
          const auth = createAuth({
            database: { db, type: "sqlite" },
            secret: env.BETTER_AUTH_SECRET || DEV_AUTH_SECRET,
            sendMagicLink: async (
              /** @type {{ email: string, url: string }} */ { email, url },
            ) => {
              server.config.logger.info(
                `[auth] sign-in link for ${email}:\n  ${url}`,
              );
            },
          });
          await dev.migrateDevAuth(auth.options);
          return auth;
        })();
        return devAuthPromise;
      };

      server.middlewares.use(async (req, res, next) => {
        const path = (req.url ?? "").split("?")[0];
        if (!path.startsWith("/api/auth")) {
          next();
          return;
        }
        try {
          const auth = await getDevAuth();
          const body = await readBody(req);
          const request = toWebRequest(
            req,
            `http://localhost${req.url ?? ""}`,
            body,
          );

          // Mirror the Worker's Turnstile gate when dev keys are present.
          if (
            path === "/api/auth/sign-in/magic-link" &&
            request.method === "POST" &&
            turnstile
          ) {
            const { verifyTurnstile } = await server.ssrLoadModule(
              "/src/lib/tracks-api.ts",
            );
            const verdict = await verifyTurnstile(request, {
              ...turnstile,
              action: "auth",
            });
            if (verdict !== "ok") {
              res.statusCode = 403;
              res.setHeader("content-type", "application/json");
              res.end(
                JSON.stringify({
                  error:
                    verdict === "missing"
                      ? "turnstile-required"
                      : "turnstile-failed",
                }),
              );
              return;
            }
          }

          await sendWebResponse(res, await auth.handler(request));
        } catch (error) {
          server.config.logger.error(
            `[dev-auth] ${error instanceof Error ? error.message : String(error)}`,
          );
          res.statusCode = 500;
          res.setHeader("content-type", "application/json");
          res.end(JSON.stringify({ error: "dev-auth-failed" }));
        }
      });

      // Dev-only scores. The score API runs against a local SQLite database in
      // the same file as the dev auth database, so the `userId` reference
      // resolves. Tracks come from the dev cache/seeds, exactly as in the
      // Worker, so the server replay reads the same track the player did.
      server.middlewares.use(async (req, res, next) => {
        const path = (req.url ?? "").split("?")[0];
        if (!path.startsWith("/api/scores")) {
          next();
          return;
        }
        try {
          const [scoreApi, devStore, load, auth] = await Promise.all([
            server.ssrLoadModule("/src/lib/score/api.ts"),
            server.ssrLoadModule("/src/lib/score/dev-store.ts"),
            server.ssrLoadModule("/src/lib/score/load.ts"),
            getDevAuth(),
          ]);

          const body = await readBody(req);
          const request = toWebRequest(
            req,
            `http://localhost${req.url ?? ""}`,
            body,
          );
          const trackStore = fileStore();

          const envScore = {
            store: devStore.createDevScoreStore(AUTH_DB),
            user: async (/** @type {Request} */ req2) => {
              const session = await auth.api.getSession({ headers: req2.headers });
              const user = session?.user;
              return user
                ? { id: user.id, handle: user.handle ?? null }
                : null;
            },
            loadTrack: (/** @type {string} */ id) =>
              load.loadTrackById(id, { store: trackStore, seed: readSeed }),
            secret: env.BETTER_AUTH_SECRET || DEV_AUTH_SECRET,
          };

          await sendWebResponse(res, await scoreApi.handleScoreRequest(request, envScore));
        } catch (error) {
          server.config.logger.error(
            `[dev-scores] ${error instanceof Error ? error.message : String(error)}`,
          );
          res.statusCode = 500;
          res.setHeader("content-type", "application/json");
          res.end(JSON.stringify({ error: "dev-scores-failed" }));
        }
      });
    },
  };
}

export default defineConfig({
  site: "https://typestar.happypaul55.com",
  // `en` is served without a prefix; the rest live under `/<locale>/…`. The
  // lyrics/caption language (`?lang=`) is a separate concern.
  i18n: {
    defaultLocale: "en",
    locales: ["en", "de", "fr", "es", "pt-BR", "ja"],
    routing: { prefixDefaultLocale: false },
  },
  build: {
    format: "file",
    inlineStylesheets: "always",
  },
  trailingSlash: "never",
  integrations: [
    // The account pages are private (noindex); keep them out of the sitemap.
    sitemap({ filter: (page) => !/\/(account|signin|u|embed)\/?$/.test(page) }),
    react(),
  ],
  vite: {
    plugins: [tailwindcss(), devServer(env)],
  },
});
