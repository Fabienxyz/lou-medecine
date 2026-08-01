/**
 * Post-install offline preparation scheduler (D2-F).
 * Fires OfflineManager.prepare asynchronously — never blocks installation.
 */
import { createPackageAccess } from "./package-access.js";
import { createOfflineManager } from "./offline-manager.js";
import { createNodeOfflineRuntime } from "./offline-runtime-node.js";
import { OFFLINE_STATUS } from "./offline-state.js";

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
    /**
     * @param {{ releaseId: string, idempotent?: boolean }} args
     */
    scheduleAfterInstall({ releaseId, idempotent = false }) {
      if (idempotent) {
        try {
          if (manager.getStatus(releaseId) === OFFLINE_STATUS.OFFLINE_READY) {
            return;
          }
        } catch {
          // Unknown release should not happen after successful install.
        }
      }
      void manager.prepare(releaseId).catch((err) => {
        const message = err instanceof Error ? err.message : String(err);
        if (options.logger?.warn) {
          options.logger.warn(
            `offline prepare failed for ${releaseId}: ${message}`
          );
        }
      });
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
