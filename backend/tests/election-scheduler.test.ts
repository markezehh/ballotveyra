import { afterEach, describe, expect, it, vi } from "vitest";

const prisma = {
  election: {
    findMany: vi.fn(),
    updateMany: vi.fn(),
  },
};

vi.mock("../src/db.js", () => ({ prisma }));
vi.mock("../src/services/logger.js", () => ({ logService: vi.fn() }));

const { closeExpiredElections } = await import("../src/services/election-scheduler.js");

describe("election close scheduler", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("closes each scheduled election whose closing time has passed", async () => {
    const now = new Date("2026-11-23T09:00:00Z");
    prisma.election.findMany.mockResolvedValue([
      { id: "election-1", title: "First", closesAt: new Date("2026-11-23T08:00:00Z") },
      { id: "election-2", title: "Second", closesAt: new Date("2026-11-23T09:00:00Z") },
    ]);
    prisma.election.updateMany.mockResolvedValue({ count: 1 });

    await closeExpiredElections(now);

    expect(prisma.election.findMany).toHaveBeenCalledWith({
      where: { status: "SCHEDULED", closesAt: { lte: now } },
      select: { id: true, title: true, closesAt: true },
    });
    expect(prisma.election.updateMany).toHaveBeenCalledTimes(2);
    expect(prisma.election.updateMany).toHaveBeenCalledWith({
      where: { id: "election-1", status: "SCHEDULED", closesAt: { lte: now } },
      data: { status: "CLOSED" },
    });
  });

  it("continues after an individual election update fails", async () => {
    prisma.election.findMany.mockResolvedValue([
      { id: "election-1", title: "First", closesAt: new Date("2026-11-23T08:00:00Z") },
      { id: "election-2", title: "Second", closesAt: new Date("2026-11-23T08:00:00Z") },
    ]);
    prisma.election.updateMany
      .mockRejectedValueOnce(new Error("database write failed"))
      .mockResolvedValueOnce({ count: 1 });
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await closeExpiredElections(new Date("2026-11-23T09:00:00Z"));

    expect(prisma.election.updateMany).toHaveBeenCalledTimes(2);
    expect(errorSpy).toHaveBeenCalledWith(
      "[ELECTION SCHEDULER] Failed to close expired election",
      expect.objectContaining({ electionId: "election-1" }),
    );
    errorSpy.mockRestore();
  });
});
