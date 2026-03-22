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

/** Map free-text commodity labels into dashboard buckets (crops vs livestock). */
export function classifyCommodityName(raw: string): { segment: "crop" | "livestock"; bucket: string } {
  const n = raw.toLowerCase().replace(/\s+/g, " ").trim();

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

function countsForBuckets<T extends string>(
  commodities: Pick<FarmerCommodity, "commodityName">[] | undefined,
  buckets: readonly T[],
  segment: "crop" | "livestock"
): { name: string; value: number }[] {
  const counts: Record<string, number> = {};
  for (const b of buckets) counts[b] = 0;
  (commodities || []).forEach((c) => {
    const { segment: seg, bucket } = classifyCommodityName(c.commodityName || "");
    if (seg === segment) counts[bucket] = (counts[bucket] ?? 0) + 1;
  });
  return buckets.map((name) => ({ name, value: counts[name] ?? 0 }));
}

export function cropCommodityChartData(
  commodities: Pick<FarmerCommodity, "commodityName">[] | undefined
): { name: string; value: number }[] {
  return countsForBuckets(commodities, CROP_BUCKET_NAMES, "crop");
}

export function livestockCommodityChartData(
  commodities: Pick<FarmerCommodity, "commodityName">[] | undefined
): { name: string; value: number }[] {
  return countsForBuckets(commodities, LIVESTOCK_BUCKET_NAMES, "livestock");
}
