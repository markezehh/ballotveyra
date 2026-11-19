export type StoredElectionStatus = "DRAFT" | "SCHEDULED" | "CLOSED" | "PUBLISHED" | "CANCELLED";

export type DerivedElectionStatus = "Draft" | "Scheduled" | "Open" | "Closed" | "Published" | "Cancelled";

export function derivedElectionStatus(
  stored: StoredElectionStatus,
  opensAt: Date | null,
  closesAt: Date | null,
  now = new Date(),
): DerivedElectionStatus {
  if (stored === "DRAFT") return "Draft";
  if (stored === "PUBLISHED") return "Published";
  if (stored === "CANCELLED") return "Cancelled";
  if (stored === "CLOSED") return "Closed";

  if (opensAt && now < opensAt) return "Scheduled";
  if (closesAt && now >= closesAt) return "Closed";
  return "Open";
}

export function isVoteWindowOpen(
  stored: StoredElectionStatus,
  opensAt: Date,
  closesAt: Date,
  now: Date,
) {
  return stored === "SCHEDULED" && now >= opensAt && now < closesAt;
}
