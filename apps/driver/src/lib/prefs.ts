import type { LaundryPreferences } from "@rapidual/shared";

const DET: Record<LaundryPreferences["detergent"], string> = {
  standard: "Standard", hypoallergenic: "Hypoallergenic", eco: "Eco", scent_free: "Scent-free",
};
const FOLD: Record<LaundryPreferences["fold"], string> = {
  standard: "Standard fold", hang_dry: "Hang-dry", kondo: "KonMari", ranger_roll: "Ranger roll",
};
const TEMP: Record<LaundryPreferences["waterTemp"], string> = { cold: "Cold", warm: "Warm", hot: "Hot" };

export function labelOfPrefs(p: LaundryPreferences): string[] {
  const out = [DET[p.detergent], TEMP[p.waterTemp], FOLD[p.fold]];
  if (p.separateDelicates) out.push("Separate delicates");
  if (p.starchShirts) out.push("Starch shirts");
  return out;
}
