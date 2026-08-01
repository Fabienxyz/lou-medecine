/**
 * Post-install offline preparation scheduler (D2-F).
 * Fires OfflineManager.prepare asynchronously — never blocks installation.
 * Does not certify offline_status (D2-G).
 */
import { createPackageAccess } from "./package-access.js";
import { createOfflineManager } from "./offline-manager.js";
import { createNodeOfflineRuntime } from "./offline-runtime-node.js";

/** @type {Map<string, ReturnType<typeof createLibraryOfflineScheduler>>} */
const schedulersByRoot = new Map();

/**
 * @param {string} libraryRoot
 * @param {{ logger?: { warn?: (msg: string) => void } }} [options]
 */
export function createLibraryOfflineScheduler(libraryRoot, options = {}) {
  const root = libraryRoot;
  const packageAccess = createPackageAccess(root);
  const runtime = createNodeOfflineRuntime(root);
  const manager = createOfflineManager({
    packageAccess,
    libraryRoot: root,
    runtime,
  });

  return {
    manager,
    runtime,
    packageAccess,
    /**
     * @param {{ releaseId: string, idempotent?: boolean }} args
     */
    scheduleAfterInstall({ releaseId, idempotent = false }) {
      void (async () => {
        if (idempotent) {
          try {
            const manifest = packageAccess.resolveManifest(releaseId);
            const digest = manifest.content_digest;
            if (
              typeof digest === "string" &&
              (await runtime.hasRelease(releaseId, digest))
            ) {
              return;
            }
          } catch {
            // Unknown release should not happen after successful install.
          }
        }
        try {
          await manager.prepare(releaseId);
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          if (options.logger?.warn) {
            options.logger.warn(
              `offline prepare failed for ${releaseId}: ${message}`
            );
          }
        }
      })();
    },
  };
}

/**
 * @param {string} libraryRoot
 * @param {{ logger?: { warn?: (msg: string) => void } }} [options]
 */
export function getLibraryOfflineScheduler(libraryRoot, options = {}) {
  const resolved = libraryRoot;
  if (!schedulersByRoot.has(resolved)) {
    schedulersByRoot.set(
      resolved,
      createLibraryOfflineScheduler(resolved, options)
    );
  }
  return schedulersByRoot.get(resolved);
}

/**
 * @param {string} libraryRoot
 * @param {{ releaseId: string, idempotent?: boolean, logger?: { warn?: (msg: string) => void } }} args
 */
export function scheduleOfflinePrepareAfterInstall(libraryRoot, args) {
  const scheduler = getLibraryOfflineScheduler(libraryRoot, {
    logger: args.logger,
  });
  scheduler.scheduleAfterInstall({
    releaseId: args.releaseId,
    idempotent: args.idempotent,
  });
}

/** Visible for tests — reset singleton schedulers. */
export function resetLibraryOfflineSchedulersForTests() {
  schedulersByRoot.clear();
}
