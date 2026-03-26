import { readFile } from "node:fs/promises";
import path from "node:path";

import { parseDynamicPricingModel } from "./pricing/parse-dynamic";
import { parseEffortPricingModel } from "./pricing/parse-effort";
import { parseProfitMarginModel } from "./pricing/parse-profit-margin";
import { parseStaffPricingPolicy } from "./pricing/parse-staff-pricing-policy";
import { parsePricingModel } from "./pricing/parse";
import type { DynamicPricingModel } from "./pricing/dynamic-types";
import type { EffortPricingModel } from "./pricing/effort-types";
import type { ProfitMarginModel } from "./pricing/profit-margin-types";
import type { StaffPricingPolicy } from "./pricing/staff-policy-types";
import type { PricingModel } from "./pricing/types";
import type { CatalogItem, Review } from "./types";

async function readJson<T>(filename: string): Promise<T> {
  const filePath = path.join(process.cwd(), "public", "data", filename);
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw) as T;
}

export async function getCatalog(): Promise<CatalogItem[]> {
  return readJson<CatalogItem[]>("catalog.json");
}

export async function getPricing(): Promise<PricingModel> {
  const raw = await readJson<unknown>("pricing.json");
  return parsePricingModel(raw);
}

export async function getEffortPricing(): Promise<EffortPricingModel> {
  const raw = await readJson<unknown>("effort-pricing.json");
  return parseEffortPricingModel(raw);
}

export async function getDynamicPricing(): Promise<DynamicPricingModel> {
  const raw = await readJson<unknown>("dynamic-pricing.json");
  return parseDynamicPricingModel(raw);
}

export async function getProfitMarginModel(): Promise<ProfitMarginModel> {
  const raw = await readJson<unknown>("profit-margin.json");
  return parseProfitMarginModel(raw);
}

export async function getStaffPricingPolicy(): Promise<StaffPricingPolicy> {
  const raw = await readJson<unknown>("staff-pricing-policy.json");
  return parseStaffPricingPolicy(raw);
}

export async function getReviews(): Promise<Review[]> {
  return readJson<Review[]>("reviews.json");
}
