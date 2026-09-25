import { describe, expect, it } from "vitest";

import { hasChangedFields } from "./has-changed-fields";

describe("hasChangedFields", () => {
  it("treats a pristine form and an unavailable snapshot as unchanged", () => {
    expect(hasChangedFields({ name: "Studio", enabled: true }, { name: "Studio", enabled: true })).toBe(false);
    expect(hasChangedFields({ name: "Studio" }, null)).toBe(false);
  });

  it("detects edits and returns to unchanged when values are restored", () => {
    const saved = { name: "Studio", enabled: true };
    expect(hasChangedFields({ ...saved, name: "Studio Nuevo" }, saved)).toBe(true);
    expect(hasChangedFields({ ...saved, enabled: false }, saved)).toBe(true);
    expect(hasChangedFields({ ...saved }, saved)).toBe(false);
  });
});
