import { describe, expect, it } from "vitest";
import { buildAggregateTally } from "../src/domains/results.js";

describe("aggregate tally", () => {
  it("includes zero-vote options and reports ties", () => {
    const tally = buildAggregateTally([
      { id: "a", label: "A", count: 10 },
      { id: "b", label: "B", count: 10 },
      { id: "c", label: "C", count: 0 },
    ], 30, 20, "election-id", "Test", new Date("2026-11-19T17:00:00Z"), "publisher-id");
    expect(tally.winnerOptionIds).toEqual(["a", "b"]);
    expect(tally.outcome).toBe("TIE");
    expect(tally.options).toHaveLength(3);
  });

  it("reports no votes cast for zero ballots", () => {
    const tally = buildAggregateTally([{ id: "a", label: "A", count: 0 }], 10, 0, "election-id", "Test", new Date(), "publisher-id");
    expect(tally.outcome).toBe("NO_VOTES_CAST");
    expect(tally.winnerOptionIds).toEqual([]);
  });
});
