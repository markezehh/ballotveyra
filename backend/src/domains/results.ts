export type TallyOption = { id: string; label: string; count: number };

export function buildAggregateTally(options: TallyOption[], eligibleCount: number, ballotsCast: number, electionId: string, title: string, closingTime: Date, publishedBy: string) {
  const max = options.reduce((highest, option) => Math.max(highest, option.count), 0);
  const leaders = max > 0 ? options.filter((option) => option.count === max).map((option) => option.id) : [];
  return {
    schemaVersion: 1,
    electionId,
    title,
    closingTime: closingTime.toISOString(),
    method: "single-choice-simple-majority",
    options: options.map((option) => ({ id: option.id, label: option.label, count: option.count })),
    eligibleCount,
    ballotsCast,
    turnout: eligibleCount > 0 ? ballotsCast / eligibleCount : 0,
    winnerOptionIds: leaders,
    outcome: max === 0 ? "NO_VOTES_CAST" : leaders.length > 1 ? "TIE" : "WINNER",
    publishedBy,
  };
}

export function tallyCsv(tally: ReturnType<typeof buildAggregateTally>): string {
  const rows = [
    ["type", "option_id", "option_label", "count", "eligible_count", "ballots_cast", "turnout"],
    ...tally.options.map((option) => ["option", option.id, option.label, String(option.count), "", "", ""]),
    ["aggregate", "", "", String(tally.ballotsCast), String(tally.eligibleCount), String(tally.ballotsCast), String(tally.turnout)],
  ];
  return rows.map((row) => row.map((field) => `"${field.replaceAll('"', '""').replace(/^[=+\-@]/, "'$&")}"`).join(",")).join("\r\n");
}
