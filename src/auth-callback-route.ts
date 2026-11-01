type CallbackLocation = Pick<Location, "pathname" | "search" | "hash">;

/** Keep legacy email callbacks working without initializing auth on marketing visits. */
export function authCallbackDestination(location: CallbackLocation): string | null {
  if (location.pathname !== "/" && location.pathname !== "/index.html") return null;
  const query = new URLSearchParams(location.search);
  const fragment = new URLSearchParams(location.hash.replace(/^#/, ""));
  const authKeys = ["access_token", "refresh_token", "code", "token_hash", "error", "error_code", "error_description"];
  if (!authKeys.some(key => query.has(key) || fragment.has(key))) return null;
  // Preserve encoded callback data byte-for-byte. The destination is always same-origin.
  return `/app/${location.search}${location.hash}`;
}
