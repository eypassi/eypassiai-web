/** Additional browser barrier; server authorization remains mandatory. */
export const FILE_MUTATIONS_HELD = true;
export const FILE_HOLD_MESSAGE = "Die Dateifunktionen sind derzeit eingeschränkt. Uploads und Änderungen mit Dateien sind pausiert; vorhandene Dateien und ihre Zuordnungen bleiben erhalten.";

export function fileMutationBlocked(report: (message: string) => void) {
  if (!FILE_MUTATIONS_HELD) return false;
  report(FILE_HOLD_MESSAGE);
  return true;
}

type Result = { error?: unknown };
type DocumentDeletion = {
  path: string | null;
  removeFile: (path: string) => Promise<Result & { data: Array<{ name: string }> | null }>;
  removeReference: () => Promise<Result>;
};

/** Keep the reference on returned errors, thrown errors and unconfirmed removal. */
export async function deleteDocumentSafely(operation: DocumentDeletion, held = FILE_MUTATIONS_HELD) {
  if (held) throw new Error(FILE_HOLD_MESSAGE);
  if (!operation.path) throw new Error("Der Dateipfad ist nicht eindeutig. Die Dokumentreferenz bleibt erhalten.");
  const removed = await operation.removeFile(operation.path);
  if (removed.error) throw removed.error;
  if (!removed.data?.some(item => item.name === operation.path)) {
    throw new Error("Die Dateilöschung wurde nicht bestätigt. Die Dokumentreferenz bleibt erhalten.");
  }
  const reference = await operation.removeReference();
  if (reference.error) throw reference.error;
}
