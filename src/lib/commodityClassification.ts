import type { FarmerCommodity } from "@/types";

export const CROP_BUCKET_NAMES = [
  "Rice",
  "Corn",
  "Sugar Cane",
  "Pineapple",
  "Banana",
  "Vegetables",
  "Fruit Trees",
  "Root Crops",
  "Spices & Industrial",
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
  if (/^ri+ce$/.test(n) || n === "palay") return "Rice";

  return n
    .split(" ")
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : ""))
    .join(" ");
}

/** Map free-text commodity labels into dashboard buckets (crops vs livestock). */
export function classifyCommodityName(raw: string): { segment: "crop" | "livestock"; bucket: string } {
  const n = normalizeCommodityText(raw);

  // Exclude timber/hardwood and other non-agricultural items from livestock
  if (/(mahogany|hardwood|timber|wood|lumber|bamboo|acacia)/.test(n)) {
    return { segment: "crop", bucket: "Other crops" };
  }

  if (/(pig|hog|swine|pork)/.test(n)) return { segment: "livestock", bucket: "Pig" };
  if (/(chicken|poultry|broiler|layer|bird)/.test(n)) return { segment: "livestock", bucket: "Chicken" };
  if (/(goat|cattle|cow|carabao|buffalo|sheep|duck|turkey|fish|tilapia|catfish|aquaculture|pet|cat|dog|rabbit|horse|donkey)/.test(n)) {
    return { segment: "livestock", bucket: "Other livestock" };
  }

  if (/(rice|palay)/.test(n)) return { segment: "crop", bucket: "Rice" };
  if (/(corn|maize)/.test(n)) return { segment: "crop", bucket: "Corn" };
  if (/(sugar|cane)/.test(n)) return { segment: "crop", bucket: "Sugar Cane" };
  if (n.includes("pineapple")) return { segment: "crop", bucket: "Pineapple" };
  if (n.includes("banana")) return { segment: "crop", bucket: "Banana" };
  
  if (/(vegetable|veg\b|gabi|kangkong|eggplant|tomato|cabbage|pechay|okra|squash|kalabasa|bitter|gourd|ampalaya|pepper|chili|bean|monggo)/.test(n)) {
    return { segment: "crop", bucket: "Vegetables" };
  }
  
  if (/(root crop|ube|cassava|sweet potato|camote|ginger|turmeric|potato)/.test(n)) {
    return { segment: "crop", bucket: "Root Crops" };
  }

  if (/(coffee|cacao|rubber|tobacco|cotton|industrial)/.test(n)) {
    return { segment: "crop", bucket: "Spices & Industrial" };
  }

  if (
    /(fruit tree|mango|citrus|coconut|papaya|lanzones|calamansi|dragon|rambutan|jackfruit|guava|pomelo|star apple)/.test(n) ||
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
    const { segment: seg, bucket } = classifyCommodityName(name);
    if (seg !== segment) return;

    // For crops, use the bucket (grouped). For livestock, use the individual label (original design).
    const label = segment === "crop" ? bucket : canonicalCommodityLabel(name);
    if (!label) return;
    
    counts.set(label, (counts.get(label) ?? 0) + 1);
  });
  
  // For crops, ensure all buckets appear even if 0
  if (segment === "crop") {
    CROP_BUCKET_NAMES.forEach(b => {
      if (!counts.has(b)) counts.set(b, 0);
    });
  }

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
