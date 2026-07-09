import { beforeEach, describe, expect, it } from "vitest";
import {
  PRESERVE_ON_LOCAL_CLEAR,
  SIGNED_OUT_FLAG,
  clearExplicitSignOut,
  hasExplicitSignOut,
  markExplicitSignOut,
} from "./persistentAuth";

describe("persistentAuth", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("tracks explicit sign-out flag", () => {
    expect(hasExplicitSignOut()).toBe(false);
    markExplicitSignOut();
    expect(hasExplicitSignOut()).toBe(true);
    clearExplicitSignOut();
    expect(hasExplicitSignOut()).toBe(false);
  });

  it("preserves auth keys during local data clear", () => {
    expect(PRESERVE_ON_LOCAL_CLEAR).toContain(SIGNED_OUT_FLAG);
    expect(PRESERVE_ON_LOCAL_CLEAR).toContain("shadowtalk_session_token");
    expect(PRESERVE_ON_LOCAL_CLEAR).toContain("shadowtalk_offline_auth");
  });
});
