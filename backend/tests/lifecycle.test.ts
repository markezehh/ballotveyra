import { describe, expect, it } from "vitest";
import { derivedElectionStatus, isVoteWindowOpen } from "../src/lifecycle.js";

describe("election lifecycle", () => {
  it("uses an inclusive opening and exclusive closing boundary", () => {
    const opens = new Date("2026-11-19T09:00:00Z");
    const closes = new Date("2026-11-19T17:00:00Z");
    expect(isVoteWindowOpen("SCHEDULED", opens, closes, opens)).toBe(true);
    expect(isVoteWindowOpen("SCHEDULED", opens, closes, closes)).toBe(false);
  });

  it("derives open and naturally closed states from database time", () => {
    const opens = new Date("2026-11-19T09:00:00Z");
    const closes = new Date("2026-11-19T17:00:00Z");
    expect(derivedElectionStatus("SCHEDULED", opens, closes, new Date("2026-11-19T08:00:00Z"))).toBe("Scheduled");
    expect(derivedElectionStatus("SCHEDULED", opens, closes, new Date("2026-11-19T10:00:00Z"))).toBe("Open");
    expect(derivedElectionStatus("SCHEDULED", opens, closes, closes)).toBe("Closed");
  });
});
