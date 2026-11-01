import assert from "node:assert/strict";
import test from "node:test";
import { authCallbackDestination } from "./auth-callback-route.ts";

test("ordinary landing visits do not start the app", () => {
  for (const [pathname, search, hash] of [
    ["/", "", ""], ["/index.html", "?utm_source=newsletter", "#funktionen"],
    ["/", "?type=signup", "#faq"], ["/", "?redirect_to=https://outside.invalid", ""],
  ]) assert.equal(authCallbackDestination({ pathname, search, hash }), null);
});

test("legacy implicit confirmation and recovery preserve the original fragment exactly", () => {
  for (const type of ["signup", "recovery", "magiclink"]) {
    const hash = `#access_token=synthetic%2Btoken&refresh_token=synthetic%2Frefresh&type=${type}&expires_in=3600`;
    assert.equal(authCallbackDestination({ pathname: "/", search: "?source=email%20link", hash }), `/app/?source=email%20link${hash}`);
  }
});

test("query-based callbacks and errors retain encoding without allowing an external destination", () => {
  for (const search of [
    "?code=synthetic%2Bcode&next=https%3A%2F%2Foutside.invalid",
    "?token_hash=synthetic%2Fhash&type=signup",
    "?error=access_denied&error_description=Link+expired",
    "?error_code=otp_expired",
  ]) assert.equal(authCallbackDestination({ pathname: "/index.html", search, hash: "#original" }), `/app/${search}#original`);
});

test("fragment errors are preserved and app or legal routes never redirect", () => {
  const hash = "#error=access_denied&error_code=otp_expired&error_description=Link+expired";
  assert.equal(authCallbackDestination({ pathname: "/", search: "", hash }), `/app/${hash}`);
  for (const pathname of ["/app/", "/app", "/privacy.html", "/knie/", "/other/"]) {
    assert.equal(authCallbackDestination({ pathname, search: "?code=synthetic", hash }), null);
  }
});
