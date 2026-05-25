import type { Farmer } from "@/types";
import { classifyCommodityName } from "./commodityClassification";

/** Comma-separated commodity labels for tables / profile summary */
export function formatCommoditySummary(names: string[]): string {
  const unique = [...new Set(names.map((n) => n.trim()).filter(Boolean))];
  return unique.join(", ");
}

/** Get the unit label for a commodity name. */
export function getCommodityUnitLabel(name: string | undefined): string {
  if (!name || !name.trim()) return "Heads";
  const normalized = name.toLowerCase();
  
  // Fish related commodities should be Area
  if (/(fish|tilapia|catfish|bangus|hatchery|aquaculture|pond)/.test(normalized)) {
    return "Area (sqm)";
  }
  
  // Swan, Quail, Geese/Goose should be Heads
  if (/(swan|quail|goose|geese)/.test(normalized)) {
    return "Heads";
  }

  const segment = classifyCommodityName(name).segment;
  if (segment === "livestock") return "Number of heads";
  return "Hectares of Area";
}

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
