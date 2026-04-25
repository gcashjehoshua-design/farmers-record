import type { FarmerCommodity } from "@/types";

export const CROP_BUCKET_NAMES = [
  "Rice",
  "Corn",
  "Sugar Cane",
  "Pineapple",
  "Banana",
  "Vegetables",
  "Fruit Trees",
  "Other crops",
] as const;

export const LIVESTOCK_BUCKET_NAMES = ["Pig", "Chicken", "Other livestock"] as const;

export const PRINT_FARM_TYPE_KEYS = [...CROP_BUCKET_NAMES, ...LIVESTOCK_BUCKET_NAMES] as const;

function normalizeCommodityText(raw: string): string {
  return raw.toLowerCase().replace(/\s+/g, " ").trim();
}

/** Keep labels readable and merge common typo variants (e.g. "Riice" -> "Rice"). */
function canonicalCommodityLabel(raw: string): string {
  const n = normalizeCommodityText(raw);
  if (!n) return "";

  // Common typo variants for rice from Excel/import data.
  if (/^ri+ce$/.test(n)) return "Rice";

  return n
    .split(" ")
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : ""))
    .join(" ");
}

/** Map free-text commodity labels into dashboard buckets (crops vs livestock). */
export function classifyCommodityName(raw: string): { segment: "crop" | "livestock"; bucket: string } {
  const n = normalizeCommodityText(raw);

  if (/(pig|hog|swine|pork)/.test(n)) return { segment: "livestock", bucket: "Pig" };
  if (/(chicken|poultry|broiler|layer)/.test(n)) return { segment: "livestock", bucket: "Chicken" };
  if (/(goat|cattle|cow|carabao|buffalo|sheep|duck|turkey)/.test(n)) {
    return { segment: "livestock", bucket: "Other livestock" };
  }

  if (/(rice|palay)/.test(n)) return { segment: "crop", bucket: "Rice" };
  if (/(corn|maize)/.test(n)) return { segment: "crop", bucket: "Corn" };
  if (/(sugar|cane)/.test(n)) return { segment: "crop", bucket: "Sugar Cane" };
  if (n.includes("pineapple")) return { segment: "crop", bucket: "Pineapple" };
  if (n.includes("banana")) return { segment: "crop", bucket: "Banana" };
  if (/(vegetable|veg\b|gabi|kangkong|eggplant|tomato|cabbage|pechay|okra)/.test(n)) {
    return { segment: "crop", bucket: "Vegetables" };
  }
  if (
    /(fruit tree|mango|citrus|coconut|papaya|lanzones|calamansi|coffee|cacao)/.test(n) ||
    (n.includes("fruit") && !n.includes("vegetable"))
  ) {
    return { segment: "crop", bucket: "Fruit Trees" };
  }

  return { segment: "crop", bucket: "Other crops" };
}

function countsForCommodities(
  commodities: Pick<FarmerCommodity, "commodityName">[] | undefined,
  segment: "crop" | "livestock"
): { name: string; value: number }[] {
  const counts = new Map<string, number>();
  (commodities || []).forEach((c) => {
    const name = c.commodityName || "";
    const { segment: seg } = classifyCommodityName(name);
    if (seg !== segment) return;
    const label = canonicalCommodityLabel(name);
    if (!label) return;
    counts.set(label, (counts.get(label) ?? 0) + 1);
  });
  return Array.from(counts.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name));
}

export function cropCommodityChartData(
  commodities: Pick<FarmerCommodity, "commodityName">[] | undefined
): { name: string; value: number }[] {
  return countsForCommodities(commodities, "crop");
}

export function livestockCommodityChartData(
  commodities: Pick<FarmerCommodity, "commodityName">[] | undefined
): { name: string; value: number }[] {
  return countsForCommodities(commodities, "livestock");
}
