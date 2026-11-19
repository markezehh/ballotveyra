import { describe, expect, it } from "vitest";
import { digestInviteToken, escapeCsvField, invitationUrl } from "../src/invitations.js";

describe("invitation helpers", () => {
  it("creates the same HMAC digest for the same credential", () => {
    expect(digestInviteToken("token", "a-secret-that-is-at-least-32-characters")).toBe(
      digestInviteToken("token", "a-secret-that-is-at-least-32-characters"),
    );
  });

  it("uses a fragment URL and escapes formula fields", () => {
    expect(invitationUrl("https://votes.example", "student-election", "abc")).toBe("https://votes.example/vote/student-election#token=abc");
    expect(escapeCsvField("=HYPERLINK(1)")).toBe('"\'=HYPERLINK(1)"');
  });
});
