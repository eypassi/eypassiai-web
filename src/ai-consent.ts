export const AI_CONSENT_VERSION = "2026-10-30";
const LEGACY_KEY = "eypassiai.aiConsent";
const KEY_PREFIX = "eypassiai.aiConsent.account.";

type ConsentStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;
export type AiRequestApproval = {
  isCurrent: () => boolean;
  signal: AbortSignal;
  release: () => void;
};

export function consentStorageKey(accountId: string) {
  return `${KEY_PREFIX}${encodeURIComponent(accountId)}`;
}

/** Local UI permission, never a substitute for server authentication/authorization. */
export function createAiConsentStore(storage: ConsentStorage, now = () => new Date().toISOString()) {
  let activeAccount: string | null = null;
  let revision = 0;
  const revoked = new Set<string>();
  const listeners = new Set<() => void>();
  const requests = new Set<AbortController>();

  // The previous browser-wide boolean cannot prove which account agreed.
  try { storage.removeItem(LEGACY_KEY); } catch { /* Unreadable storage stays unapproved. */ }

  function notify() {
    revision++;
    requests.forEach(controller => controller.abort());
    requests.clear();
    listeners.forEach(listener => listener());
  }

  function isApproved(accountId: string) {
    if (!accountId || activeAccount !== accountId || revoked.has(accountId)) return false;
    try {
      const record = JSON.parse(storage.getItem(consentStorageKey(accountId)) ?? "null");
      return Boolean(record && record.accountId === accountId && record.version === AI_CONSENT_VERSION &&
        typeof record.acceptedAt === "string" && Number.isFinite(Date.parse(record.acceptedAt)));
    } catch {
      return false;
    }
  }

  return {
    activateAccount(accountId: string | null) {
      if (activeAccount === accountId) return;
      if (activeAccount) {
        // A known account ending its session must approve again on return.
        revoked.add(activeAccount);
        try { storage.removeItem(consentStorageKey(activeAccount)); } catch { /* The in-memory revocation still blocks this account. */ }
      }
      activeAccount = accountId;
      notify();
    },
    invalidateRequests() {
      // UI teardown is not an explicit logout or account switch.
      notify();
    },
    isApproved,
    getSnapshot(accountId: string) {
      return `${revision}:${isApproved(accountId)}`;
    },
    grant(accountId: string) {
      if (!accountId || activeAccount !== accountId) return false;
      try {
        storage.setItem(consentStorageKey(accountId), JSON.stringify({
          accountId, version: AI_CONSENT_VERSION, acceptedAt: now(),
        }));
        revoked.delete(accountId);
        notify();
        return isApproved(accountId);
      } catch {
        return false;
      }
    },
    revoke(accountId: string) {
      revoked.add(accountId);
      let persisted = true;
      try { storage.removeItem(consentStorageKey(accountId)); } catch { persisted = false; }
      notify();
      return persisted;
    },
    requestApproval(accountId: string): AiRequestApproval | null {
      if (!isApproved(accountId)) return null;
      const startedAtRevision = revision;
      const controller = new AbortController();
      requests.add(controller);
      return {
        isCurrent: () => !controller.signal.aborted && revision === startedAtRevision && isApproved(accountId),
        signal: controller.signal,
        release: () => { requests.delete(controller); },
      };
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    storageChanged(key: string | null) {
      if (key === null || (activeAccount && key === consentStorageKey(activeAccount))) notify();
    },
  };
}
