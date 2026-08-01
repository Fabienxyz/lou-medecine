/**
 * D4 RestoreContext catalog facts (Reader/bootstrap only — not Session Service).
 */

/**
 * @param {{
 *   chapter: string,
 *   packageAccess?: {
 *     listReleases: () => Promise<Array<Record<string, unknown>>>,
 *     getActiveRelease: (chapter: string) => Promise<Record<string, unknown>>,
 *   },
 *   releaseId?: string|null,
 *   offlineStatus?: string|null,
 * }} options
 */
export async function buildRestoreCatalogFacts(options) {
  const chapter = options.chapter;
  const releaseId = options.releaseId || null;

  if (options.packageAccess) {
    const packageAccess = options.packageAccess;
    const releases = await packageAccess.listReleases();
    const installedReleaseIds = releases
      .filter((entry) => entry && entry.installed_at && entry.release_id)
      .map((entry) => /** @type {string} */ (entry.release_id));
    const active = await packageAccess.getActiveRelease(chapter);
    const activeReleaseId = /** @type {string} */ (active.release_id);
    const targetEntry =
      releases.find((entry) => entry.release_id === releaseId) ||
      releases.find((entry) => entry.release_id === activeReleaseId) ||
      active;
    return {
      activeReleaseId,
      installedReleaseIds,
      releaseInstalled:
        !!releaseId && installedReleaseIds.indexOf(releaseId) >= 0,
      offlineStatus:
        options.offlineStatus ??
        (targetEntry && targetEntry.offline_status
          ? targetEntry.offline_status
          : null),
    };
  }

  const installedReleaseIds = releaseId ? [releaseId] : [];
  return {
    activeReleaseId: releaseId,
    installedReleaseIds,
    releaseInstalled: !!releaseId,
    offlineStatus: options.offlineStatus ?? null,
  };
}
