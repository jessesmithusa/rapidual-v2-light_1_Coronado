import type { Detergent, FoldStyle, WaterTemp } from "@rapidual/shared";

export const DETERGENTS: { v: Detergent; label: string }[] = [
  { v: "standard", label: "Standard" },
  { v: "hypoallergenic", label: "Hypoallergenic" },
  { v: "eco", label: "Eco" },
  { v: "scent_free", label: "Scent-free" },
];

export const FOLDS: { v: FoldStyle; label: string }[] = [
  { v: "standard", label: "Standard fold" },
  { v: "hang_dry", label: "Hang-dry" },
  { v: "kondo", label: "KonMari" },
  { v: "ranger_roll", label: "Ranger roll" },
];

export const TEMPS: { v: WaterTemp; label: string }[] = [
  { v: "cold", label: "Cold" },
  { v: "warm", label: "Warm" },
  { v: "hot", label: "Hot" },
];

export function labelOf<T extends string>(opts: { v: T; label: string }[], v: T): string {
  return opts.find((o) => o.v === v)?.label ?? v;
}
