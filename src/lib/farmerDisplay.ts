import type { Farmer } from "@/types";

/** Display / storage: "Last name, First name Middle name" (optional extension e.g. Jr.) */
export function buildOfficialFullName(
  lastName: string,
  firstName: string,
  middleName?: string,
  extName?: string
): string {
  const last = (lastName || "").trim();
  const first = (firstName || "").trim();
  const mid = (middleName || "").trim();
  const ext = (extName || "").trim();
  const rest = [first, mid, ext].filter(Boolean).join(" ").trim();
  if (!last) return rest;
  return rest ? `${last}, ${rest}` : last;
}

/** Prefer structured fields; fall back to legacy full_name in the database */
export function formatFarmerDisplayName(f: Pick<Farmer, "lastName" | "firstName" | "middleName" | "fullName">): string {
  const last = f.lastName?.trim();
  const first = f.firstName?.trim();
  const mid = f.middleName?.trim();
  if (last || first || mid) {
    return buildOfficialFullName(last || "", first || "", mid || undefined);
  }
  return (f.fullName || "").trim();
}

/** Comma-separated commodity labels for tables / profile summary */
export function formatCommoditySummary(names: string[]): string {
  const unique = [...new Set(names.map((n) => n.trim()).filter(Boolean))];
  return unique.join(", ");
}
