/**
 * Purge processed tracks from R2.
 *
 * The track cache is keyed by `tracks/<id>/<lang>.json`, and `tracks:publish`
 * only adds or overwrites — it never removes stale objects. So when the built
 * track format changes (see TRACK_VERSION), the old objects must be purged or
 * the Worker keeps serving the previous format.
 *
 * Uses the Cloudflare REST API, so it needs an API token with R2 edit access:
 *
 *   CLOUDFLARE_ACCOUNT_ID=... CLOUDFLARE_API_TOKEN=... bun run tracks:purge
 *
 * Pass `--dry-run` to list what would be deleted, and `--prefix=<p>` to target
 * a different prefix (default `tracks/`).
 */

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const BUCKET = "typestar-tracks";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const prefix = args.find((arg) => arg.startsWith("--prefix="))?.slice("--prefix=".length) ?? "tracks/";

if (!ACCOUNT_ID || !API_TOKEN) {
  console.error(
    "Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN (R2 edit access) to purge the cache.",
  );
  process.exit(1);
}

const base = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/r2/buckets/${BUCKET}/objects`;
const auth = { authorization: `Bearer ${API_TOKEN}` };

/** List every object key under the prefix, following the cursor. */
async function listKeys(): Promise<string[]> {
  const keys: string[] = [];
  let cursor: string | undefined;
  do {
    const url = new URL(base);
    url.searchParams.set("prefix", prefix);
    url.searchParams.set("per_page", "1000");
    if (cursor) url.searchParams.set("cursor", cursor);

    const response = await fetch(url, { headers: auth });
    const data = (await response.json()) as {
      success: boolean;
      result?: { key: string }[];
      result_info?: { cursor?: string; is_truncated?: boolean };
      errors?: unknown;
    };
    if (!response.ok || !data.success) {
      throw new Error(`Listing failed: ${JSON.stringify(data.errors ?? data)}`);
    }
    for (const object of data.result ?? []) keys.push(object.key);
    cursor = data.result_info?.is_truncated === false ? undefined : data.result_info?.cursor;
  } while (cursor);
  return keys;
}

const keys = await listKeys();
if (keys.length === 0) {
  console.log(`Nothing to purge under "${prefix}".`);
  process.exit(0);
}

if (dryRun) {
  console.log(`Would purge ${keys.length} object(s) under "${prefix}":`);
  for (const key of keys) console.log(`  ${key}`);
  process.exit(0);
}

for (let i = 0; i < keys.length; i += 100) {
  const batch = keys.slice(i, i + 100);
  const response = await fetch(base, {
    method: "DELETE",
    headers: { ...auth, "content-type": "application/json" },
    body: JSON.stringify(batch),
  });
  const data = (await response.json()) as { success: boolean; errors?: unknown };
  if (!response.ok || !data.success) {
    throw new Error(`Delete failed: ${JSON.stringify(data.errors ?? data)}`);
  }
  console.log(`Deleted ${batch.length} object(s).`);
}

console.log(`\nPurged ${keys.length} object(s) under "${prefix}". Run \`bun run tracks:publish\` to republish.`);

export {};

