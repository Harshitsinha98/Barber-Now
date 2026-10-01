import type { SalonType, ServiceCategory } from "./supabase/database.types";

export const SALON_TYPES: { value: SalonType; label: string; short: string; emoji: string; desc: string }[] = [
  { value: "men", label: "Men's salon / Barbershop", short: "Men", emoji: "💈", desc: "Haircuts, beard, shave" },
  { value: "women", label: "Women's salon / Beauty parlour", short: "Women", emoji: "💅", desc: "Hair, skin, nails, waxing, makeup" },
  { value: "unisex", label: "Unisex salon", short: "Unisex", emoji: "✨", desc: "Everyone welcome" },
];

export function salonTypeLabel(t?: SalonType | null): string {
  return SALON_TYPES.find((s) => s.value === t)?.short ?? "Men";
}

/** Service categories, in display order. `for` = which salon types usually offer it. */
export const SERVICE_CATEGORIES: { value: ServiceCategory; label: string; emoji: string; for: SalonType[] }[] = [
  { value: "hair", label: "Haircut & styling", emoji: "✂️", for: ["men", "women", "unisex"] },
  { value: "colour", label: "Hair colour", emoji: "🎨", for: ["men", "women", "unisex"] },
  { value: "beard", label: "Beard", emoji: "🧔", for: ["men", "unisex"] },
  { value: "shave", label: "Shave", emoji: "🪒", for: ["men", "unisex"] },
  { value: "skin", label: "Facial & skin", emoji: "🧖", for: ["men", "women", "unisex"] },
  { value: "threading", label: "Threading", emoji: "🧵", for: ["women", "unisex"] },
  { value: "waxing", label: "Waxing", emoji: "🌸", for: ["women", "unisex"] },
  { value: "nails", label: "Mani & pedi", emoji: "💅", for: ["women", "unisex"] },
  { value: "makeup", label: "Makeup & bridal", emoji: "💄", for: ["women", "unisex"] },
  { value: "spa", label: "Spa & massage", emoji: "💆", for: ["men", "women", "unisex"] },
  { value: "combo", label: "Combos & packages", emoji: "⭐", for: ["men", "women", "unisex"] },
  { value: "kids", label: "Kids", emoji: "🧒", for: ["men", "women", "unisex"] },
];

export const ALL_CATEGORY_VALUES = SERVICE_CATEGORIES.map((c) => c.value);

export function categoryLabel(c: string): string {
  return SERVICE_CATEGORIES.find((x) => x.value === c)?.label ?? c;
}

export interface QuickService {
  name: string;
  price: number;
  duration: number;
  category: ServiceCategory;
}

const MEN: QuickService[] = [
  { name: "Haircut", price: 200, duration: 30, category: "hair" },
  { name: "Beard trim", price: 100, duration: 15, category: "beard" },
  { name: "Shave", price: 100, duration: 20, category: "shave" },
  { name: "Hair + Beard combo", price: 280, duration: 45, category: "combo" },
  { name: "Head massage", price: 150, duration: 20, category: "spa" },
  { name: "Kids haircut", price: 150, duration: 20, category: "kids" },
];

const WOMEN: QuickService[] = [
  { name: "Haircut & blow-dry", price: 600, duration: 45, category: "hair" },
  { name: "Eyebrow threading", price: 60, duration: 10, category: "threading" },
  { name: "Upper lip threading", price: 40, duration: 5, category: "threading" },
  { name: "Full arms waxing", price: 350, duration: 25, category: "waxing" },
  { name: "Cleanup / facial", price: 800, duration: 45, category: "skin" },
  { name: "Manicure", price: 500, duration: 40, category: "nails" },
  { name: "Pedicure", price: 600, duration: 45, category: "nails" },
  { name: "Global hair colour", price: 2500, duration: 120, category: "colour" },
  { name: "Hair spa", price: 900, duration: 60, category: "spa" },
  { name: "Party makeup", price: 2500, duration: 75, category: "makeup" },
];

/** Quick-add templates for the services form, by salon type. */
export function quickServices(type?: SalonType | null): QuickService[] {
  if (type === "women") return WOMEN;
  if (type === "unisex") return [MEN[0], MEN[1], WOMEN[0], WOMEN[1], WOMEN[4], WOMEN[5], WOMEN[8], MEN[3]];
  return MEN;
}
