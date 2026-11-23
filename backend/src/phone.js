/**
 * @param {unknown} value
 * @returns {string | null}
 */
export function normalizePhone(value) {
  if (typeof value !== "string") return null;
  const phone = value.normalize("NFKC").trim();
  return phone && phone.length <= 32 ? phone : null;
}
