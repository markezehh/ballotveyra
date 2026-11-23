import { describe, expect, it } from "vitest";
import { normalizePhone } from "../src/phone.js";
import { normalizedPhone } from "../src/validation.js";

describe("voter phone numbers", () => {
  it("preserves the entered phone number while trimming outer whitespace", () => {
    expect(normalizePhone(" 08012345678 ")).toBe("08012345678");
    expect(normalizedPhone.parse(" +1 (415) 555-0123 ")).toBe("+1 (415) 555-0123");
  });

  it("rejects empty and overly long values", () => {
    expect(normalizePhone("")).toBeNull();
    expect(normalizePhone("   ")).toBeNull();
    expect(normalizePhone("123456789012345678901234567890123")).toBeNull();
  });
});
