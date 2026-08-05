/**
 * Playwright resolution for lou-build — local dependency only.
 */

import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

export function resolvePlaywright() {
  const local = path.join(__dirname, "..", "node_modules", "playwright");
  try {
    return require(local);
  } catch {
    throw new Error(
      "playwright is required in tools/lou-build — run: npm install && npm run playwright:install",
    );
  }
}
