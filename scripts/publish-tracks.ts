/**
 * Publish pre-warmed tracks to R2.
 *
 * Uploads every `public/tracks/<id>.json` produced by `bun run tracks:warm` to
 * the `typestar-tracks` bucket at `tracks/<id>/en.json`, so the deployed API
 * serves them from R2 without a live YouTube lookup.
 *
 * Needs Cloudflare credentials (`wrangler login`, or `CLOUDFLARE_API_TOKEN` and
 * `CLOUDFLARE_ACCOUNT_ID`) and the bucket to exist — `bun run tracks:bucket`
 * creates it. Pass `--dry-run` to see the commands without running them.
 *
 *   bun run tracks:bucket     # create the R2 bucket (once)
 *   bun run tracks:publish
 *   bun run tracks:publish -- --dry-run
 */

import { spawnSync } from "node:child_process";
import { readdir } from "node:fs/promises";
import { join } from "node:path";

const BUCKET = "typestar-tracks";
const SOURCE_DIR = join(process.cwd(), "public", "tracks");
const dryRun = process.argv.includes("--dry-run");

const files = (await readdir(SOURCE_DIR)).filter((name) => name.endsWith(".json"));
if (!files.length) {
  console.error(`No tracks found in ${SOURCE_DIR}. Run \`bun run tracks:warm\` first.`);
  process.exit(1);
}

function run(args: string[]): { ok: boolean; output: string } {
  const result = spawnSync("bunx", args, { encoding: "utf8", shell: true });
  return { ok: result.status === 0, output: `${result.stdout ?? ""}${result.stderr ?? ""}` };
}

let failures = 0;
for (const file of files) {
  const id = file.replace(/\.json$/, "");
  // UltraStar seeds are keyed by their URL hash; YouTube seeds keep the id.
  const key = id.startsWith("ultrastar-")
    ? `${BUCKET}/tracks/ultrastar/${id.slice("ultrastar-".length)}/en.json`
    : `${BUCKET}/tracks/${id}/en.json`;
  const source = join(SOURCE_DIR, file);
  const args = ["wrangler", "r2", "object", "put", key, "--file", source, "--remote"];

  if (dryRun) {
    console.log(`· bunx ${args.join(" ")}`);
    continue;
  }

  const { ok, output } = run(args);
  if (ok) {
    console.log(`✓ ${id}`);
    continue;
  }

  failures++;
  if (/bucket does not exist/i.test(output)) {
    console.error(
      `✗ Bucket "${BUCKET}" does not exist.\n` +
        `  Create it once with:  bun run tracks:bucket\n` +
        `  Then retry:           bun run tracks:publish`,
    );
    break;
  }
  console.error(`✗ ${id} failed`);
  console.error(output.trim());
}

if (failures) process.exitCode = 1;
else if (!dryRun) console.log(`\nPublished ${files.length} track(s) to ${BUCKET}.`);
