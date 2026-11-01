export const STORAGE_NOTICE_KEY = "eypassiai.storageNotice";
export const STORAGE_NOTICE_VERSION = "2026-11-01";
const MAX_AGE_MS = 180 * 24 * 60 * 60 * 1000;

type NoticeStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

/** A notice preference only; never reads or changes authentication or AI approval. */
export function createStorageNoticeState(storage: NoticeStorage, now = Date.now) {
  let dismissedThisPage = false;

  function isDismissed() {
    if (dismissedThisPage) return true;
    let stored: string | null;
    try { stored = storage.getItem(STORAGE_NOTICE_KEY); } catch { return false; }
    if (stored === null) return false;

    try {
      const record = JSON.parse(stored);
      const currentTime = now();
      if (record && record.version === STORAGE_NOTICE_VERSION &&
        typeof record.dismissedAt === "number" && Number.isFinite(record.dismissedAt) &&
        record.dismissedAt >= 0 && record.dismissedAt <= currentTime &&
        currentTime - record.dismissedAt < MAX_AGE_MS) return true;
    } catch { /* Invalid JSON is an unacknowledged notice. */ }

    // Expiry is checked on a visit, not by a background deletion promise.
    try { storage.removeItem(STORAGE_NOTICE_KEY); } catch { /* Showing the notice remains safe. */ }
    return false;
  }

  return {
    isDismissed,
    dismiss() {
      dismissedThisPage = true;
      try {
        storage.setItem(STORAGE_NOTICE_KEY, JSON.stringify({
          version: STORAGE_NOTICE_VERSION,
          dismissedAt: now(),
        }));
      } catch { /* A blocked browser store must not prevent closing for this page. */ }
    },
  };
}
