import { describe, expect, it } from "vitest";
import type { StoredElectionStatus } from "../src/lifecycle.js";

describe("stored election lifecycle", () => {
  it("uses the database status enum as-is", () => {
    const statuses: StoredElectionStatus[] = ["DRAFT", "SCHEDULED", "CLOSED", "PUBLISHED", "CANCELLED"];
    expect(statuses).toEqual(["DRAFT", "SCHEDULED", "CLOSED", "PUBLISHED", "CANCELLED"]);
  });
});
