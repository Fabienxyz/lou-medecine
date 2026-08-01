/**
 * Offline status model — library catalog entries (OFFLINE-COMPONENT-CONTRACT D2-B).
 * State machine and persistence helpers only — no cache, no Package Access, no Reader.
 */

/** @typedef {'not_prepared' | 'preparing' | 'offline_ready' | 'failed'} OfflineStatus */

/** @typedef {'INVALID_STATUS' | 'INVALID_TRANSITION' | 'UNKNOWN_RELEASE'} OfflineStateErrorCode */

export const OFFLINE_STATUS = Object.freeze({
  NOT_PREPARED: "not_prepared",
  PREPARING: "preparing",
  OFFLINE_READY: "offline_ready",
  FAILED: "failed",
});

/** @type {readonly OfflineStatus[]} */
export const OFFLINE_STATUSES = Object.freeze([
  OFFLINE_STATUS.NOT_PREPARED,
  OFFLINE_STATUS.PREPARING,
  OFFLINE_STATUS.OFFLINE_READY,
  OFFLINE_STATUS.FAILED,
]);

export const DEFAULT_OFFLINE_STATUS = OFFLINE_STATUS.NOT_PREPARED;

/** @type {Readonly<Record<OfflineStatus, readonly OfflineStatus[]>>} */
const ALLOWED_TRANSITIONS = Object.freeze({
  [OFFLINE_STATUS.NOT_PREPARED]: [OFFLINE_STATUS.PREPARING],
  [OFFLINE_STATUS.PREPARING]: [
    OFFLINE_STATUS.OFFLINE_READY,
    OFFLINE_STATUS.FAILED,
  ],
  [OFFLINE_STATUS.FAILED]: [OFFLINE_STATUS.PREPARING],
  [OFFLINE_STATUS.OFFLINE_READY]: [
    OFFLINE_STATUS.PREPARING,
    OFFLINE_STATUS.FAILED,
  ],
});

export class OfflineStateError extends Error {
  /**
   * @param {OfflineStateErrorCode} code
   * @param {string} message
   */
  constructor(code, message) {
    super(message);
    this.name = "OfflineStateError";
    this.code = code;
  }
}

/**
 * @param {unknown} status
 * @returns {status is OfflineStatus}
 */
export function isOfflineStatus(status) {
  return (
    typeof status === "string" &&
    /** @type {readonly string[]} */ (OFFLINE_STATUSES).includes(status)
  );
}

/**
 * @param {unknown} status
 * @returns {string[]}
 */
export function validateOfflineStatus(status) {
  if (isOfflineStatus(status)) {
    return [];
  }
  return [
    `offline_status must be one of ${OFFLINE_STATUSES.join("|")} (got ${JSON.stringify(status)})`,
  ];
}

/**
 * @param {unknown} status
 * @returns {OfflineStatus}
 */
export function assertOfflineStatus(status) {
  const errors = validateOfflineStatus(status);
  if (errors.length) {
    throw new OfflineStateError("INVALID_STATUS", errors[0]);
  }
  return /** @type {OfflineStatus} */ (status);
}

/**
 * @param {unknown} status
 * @returns {boolean}
 */
export function isOfflineReady(status) {
  return status === OFFLINE_STATUS.OFFLINE_READY;
}

/**
 * @param {unknown} from
 * @param {unknown} to
 * @returns {boolean}
 */
export function canTransitionOfflineStatus(from, to) {
  if (!isOfflineStatus(from) || !isOfflineStatus(to)) {
    return false;
  }
  if (from === to) {
    return true;
  }
  return ALLOWED_TRANSITIONS[from].includes(to);
}

/**
 * @param {unknown} from
 * @param {unknown} to
 * @returns {OfflineStatus}
 */
export function transitionOfflineStatus(from, to) {
  const fromStatus = assertOfflineStatus(from);
  const toStatus = assertOfflineStatus(to);
  if (fromStatus === toStatus) {
    return toStatus;
  }
  if (!ALLOWED_TRANSITIONS[fromStatus].includes(toStatus)) {
    throw new OfflineStateError(
      "INVALID_TRANSITION",
      `offline transition forbidden: ${fromStatus} -> ${toStatus}`
    );
  }
  return toStatus;
}

/**
 * @param {Record<string, unknown>} entry
 * @returns {OfflineStatus}
 */
export function loadOfflineStatus(entry) {
  if (!entry || typeof entry !== "object") {
    throw new OfflineStateError(
      "INVALID_STATUS",
      "offline status: catalog entry missing"
    );
  }
  return assertOfflineStatus(entry.offline_status);
}

/**
 * Direct status write — validates value only (migration bootstrap).
 * @param {Record<string, unknown>} entry
 * @param {unknown} status
 * @returns {OfflineStatus}
 */
export function setOfflineStatus(entry, status) {
  if (!entry || typeof entry !== "object") {
    throw new OfflineStateError(
      "INVALID_STATUS",
      "offline status: catalog entry missing"
    );
  }
  const next = assertOfflineStatus(status);
  entry.offline_status = next;
  return next;
}

/**
 * @param {Record<string, unknown>} catalog
 * @param {string} releaseId
 * @returns {OfflineStatus}
 */
export function getCatalogOfflineStatus(catalog, releaseId) {
  return loadOfflineStatus(requireCatalogEntry(catalog, releaseId));
}

/**
 * @param {Record<string, unknown>} catalog
 * @param {string} releaseId
 * @param {unknown} toStatus
 * @returns {OfflineStatus}
 */
export function transitionCatalogOfflineStatus(catalog, releaseId, toStatus) {
  const entry = requireCatalogEntry(catalog, releaseId);
  const fromStatus = loadOfflineStatus(entry);
  const next = transitionOfflineStatus(fromStatus, toStatus);
  entry.offline_status = next;
  return next;
}

/**
 * Add default offline_status to legacy entries (not_prepared).
 * @param {Record<string, unknown>} catalog
 * @returns {Record<string, unknown>}
 */
export function migrateCatalogOfflineStatus(catalog) {
  if (!catalog || typeof catalog !== "object" || !Array.isArray(catalog.entries)) {
    return catalog;
  }
  for (const entry of catalog.entries) {
    if (!entry || typeof entry !== "object") continue;
    if (
      entry.offline_status === undefined ||
      entry.offline_status === null ||
      entry.offline_status === ""
    ) {
      entry.offline_status = DEFAULT_OFFLINE_STATUS;
    }
  }
  return catalog;
}

/**
 * @param {Record<string, unknown>} catalog
 * @param {string} releaseId
 */
function requireCatalogEntry(catalog, releaseId) {
  if (!catalog || typeof catalog !== "object" || !Array.isArray(catalog.entries)) {
    throw new OfflineStateError(
      "UNKNOWN_RELEASE",
      "offline status: catalog entries missing"
    );
  }
  const entry = catalog.entries.find((e) => e && e.release_id === releaseId);
  if (!entry) {
    throw new OfflineStateError(
      "UNKNOWN_RELEASE",
      `offline status: release not in catalog: ${releaseId}`
    );
  }
  return entry;
}
