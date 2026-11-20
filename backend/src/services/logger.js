const BOLD = "\u001b[1m";
const RESET = "\u001b[0m";

export function logService(service, action, details = {}) {
  const suffix = Object.keys(details).length
    ? ` ${JSON.stringify(details)}`
    : "";
  console.log(`${BOLD}[SERVICE:${service}] ${action}${RESET}${suffix}`);
}
