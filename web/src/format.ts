const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** '2026-06-07' → '7 Jun 2026' */
export function fmtDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return `${d} ${MONTHS[(m ?? 1) - 1]} ${y}`;
}

/** ISO timestamp → '12 Jun 2026, 09:15 UTC' */
export function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  return `${fmtDate(iso)}, ${hh}:${mm} UTC`;
}

export function isStale(updatedAtIso: string, maxHours = 48): boolean {
  return Date.now() - Date.parse(updatedAtIso) > maxHours * 3_600_000;
}
