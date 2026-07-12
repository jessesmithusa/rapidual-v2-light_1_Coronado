import { useEffect, useMemo, useState } from "react";
import { View, ScrollView, Pressable, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Text, Card, Button, Input, Badge } from "@rapidual/ui";
import { currency, shortDate, timeOfDay, pickupQuote, RUSH_FEE } from "@rapidual/utils";
import { matchRoutes, slotStatus } from "@rapidual/logistics-engine";
import type { Address, LaundryPreferences, Order } from "@rapidual/shared";
import { colors } from "@/theme/tokens";
import { OC_ROUTES } from "@/mock/routes";
import { MOCK_ADDRESSES } from "@/mock/addresses";
import { useUserLocation } from "@/hooks/useUserLocation";
import { createOrder } from "@/lib/orders";
import { DEFAULT_PREFERENCES } from "@/lib/defaults";
import { presentBagPayment } from "@/lib/payments";
import { createLaundryOrder, committedBagsFor, cancelOrder } from "@/data/repo";
import { SavingsPanel } from "@/components/SavingsPanel";
import { useRecurring } from "@/store/recurring";
import { useLoyalty } from "@/store/loyalty";
import { DETERGENTS, FOLDS, TEMPS, labelOf } from "@/lib/preferences";
import { Chip } from "./Chip";
import { nextServiceDates } from "./dates";

const STEPS = ["Address", "Date", "Bags", "Preferences", "Review"] as const;

export function ScheduleWizard() {
  const router = useRouter();
  const { coords } = useUserLocation();
  const [step, setStep] = useState(0);
  const [addresses, setAddresses] = useState<Address[]>(MOCK_ADDRESSES);
  const [addressId, setAddressId] = useState<string | null>(MOCK_ADDRESSES[0]?.id ?? null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ label: "Home", line1: "", city: "", zip: "" });

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [bagCount, setBagCount] = useState(1);
  const [prefs, setPrefs] = useState<LaundryPreferences>(DEFAULT_PREFERENCES);

  const [rush, setRush] = useState(false);
  const [addons, setAddons] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [created, setCreated] = useState<Order | null>(null);
  const [repeatWeekly, setRepeatWeekly] = useState(false);
  const setRecurringActive = useRecurring((s) => s.setActive);
  const setRecurringWeekday = useRecurring((s) => s.setWeekday);
  const setRecurringBags = useRecurring((s) => s.setBags);
  const [promoCode, setPromoCode] = useState("");
  const [promoKind, setPromoKind] = useState<"pct15" | "cred5" | null>(null);
  const [promoNote, setPromoNote] = useState<string | null>(null);
  const earnPoints = useLoyalty((s) => s.earn);

  const selectedAddress = addresses.find((a) => a.id === addressId) ?? null;

  const route = useMemo(() => {
    if (!selectedAddress) return null;
    return (
      OC_ROUTES.find((r) => r.id === selectedAddress.routeId) ??
      matchRoutes(selectedAddress, OC_ROUTES, 100)[0]?.route ??
      null
    );
  }, [selectedAddress]);

  const dates = useMemo(() => (route ? nextServiceDates(route.serviceDay) : []), [route]);
  const committedFor = (iso: string) => {
    let h = 0;
    for (let i = 0; i < iso.length; i++) h = (h * 31 + iso.charCodeAt(i)) >>> 0;
    return h % 66;
  };
  // Real committed bags per slot when the backend is live; hash fallback otherwise.
  const [committed, setCommitted] = useState<Record<string, number>>({});
  useEffect(() => {
    if (!route) return;
    let on = true;
    (async () => {
      const out: Record<string, number> = {};
      for (const d of dates) {
        const iso = d.toISOString();
        const n = await committedBagsFor(route.id, iso);
        if (n !== null) out[iso] = n;
      }
      if (on && Object.keys(out).length) setCommitted(out);
    })();
    return () => { on = false; };
  }, [route, dates]);

  // Reset the chosen date whenever the route (and thus the service day) changes.
  useEffect(() => {
    setSelectedDate(null);
  }, [route?.id]);

  const quote = pickupQuote(bagCount);
  const discount = promoKind === "pct15" ? Math.round(quote.total * 15) / 100 : promoKind === "cred5" ? Math.min(quote.total, 5) : 0;
  const dueNow = Math.round((quote.total - discount + (rush ? RUSH_FEE : 0)) * 100) / 100;
  const pointsToEarn = Math.round(dueNow * 10);

  const applyPromo = () => {
    const c = promoCode.trim().toUpperCase();
    if (c === "WELCOME15" || c === "RAPID15") { setPromoKind("pct15"); setPromoNote("15% off applied"); }
    else if (c === "FREEDEL") { setPromoKind("cred5"); setPromoNote("$5 credit applied"); }
    else { setPromoKind(null); setPromoNote(c ? "Invalid code" : null); }
  };

  const canContinue =
    (step === 0 && !!addressId && !adding) ||
    (step === 1 && !!selectedDate) ||
    step === 2 ||
    step === 3;

  const saveNewAddress = () => {
    if (!draft.line1 || !draft.city || !draft.zip) return;
    const matched = matchRoutes(coords, OC_ROUTES, 100)[0]?.route;
    const addr: Address = {
      id: `addr_${Math.random().toString(36).slice(2, 7)}`,
      label: draft.label || "Home",
      line1: draft.line1,
      city: draft.city,
      state: "CA",
      zip: draft.zip,
      lat: coords.lat,
      lng: coords.lng,
      routeId: matched?.id,
    };
    setAddresses((prev) => [...prev, addr]);
    setAddressId(addr.id);
    setAdding(false);
    setDraft({ label: "Home", line1: "", city: "", zip: "" });
  };

  const confirm = async () => {
    if (!route || !selectedDate) return;
    setSubmitting(true);
    setPayError(null);
    // Create the real order first (when live) so the charge carries its id and
    // the Stripe webhook can mark it paid server-side.
    const liveOrderId = await createLaundryOrder({
      bagCount,
      perBag: quote.effectivePerBag,
      scheduledForISO: selectedDate,
      routeId: route.id,
      addressId: addressId ?? null,
      preferences: { ...(prefs as unknown as Record<string, unknown>), rush, addons },
    });
    if (quote.bags > 0) {
      const pay = await presentBagPayment(quote.bags, liveOrderId ?? undefined, rush);
      if (!pay.ok) {
        if (liveOrderId) void cancelOrder(liveOrderId); // don't strand an unpaid order
        setPayError(pay.message);
        setSubmitting(false);
        return;
      }
    }
    const order = await createOrder({
      addressId: addressId!,
      routeId: route.id,
      scheduledFor: selectedDate,
      bagCount,
      preferences: prefs,
    });
    earnPoints(pointsToEarn);
    if (repeatWeekly) {
      setRecurringWeekday(new Date(selectedDate).getDay());
      setRecurringBags(bagCount);
      setRecurringActive(true);
    }
    setSubmitting(false);
    setCreated(order);
    setStep(5);
  };

  const reset = () => {
    setCreated(null);
    setStep(0);
    setBagCount(1);
    setSelectedDate(null);
  };

  // ── Success ──────────────────────────────────────────────
  if (step === 5 && created) {
    return (
      <SafeAreaView className="flex-1 bg-navy-900" edges={["top"]}>
        <View className="flex-1 px-5 justify-center items-center">
          <View className="w-20 h-20 rounded-full bg-success/15 items-center justify-center">
            <Ionicons name="checkmark" size={42} color={colors.success} />
          </View>
          <Text variant="title" className="mt-6 text-center">
            Pickup scheduled
          </Text>
          <Text variant="label" className="mt-2 text-center leading-6">
            {shortDate(created.scheduledFor)} · {selectedAddress?.label} · {created.bagCount} bag
            {created.bagCount > 1 ? "s" : ""}
          </Text>
        </View>
        <View className="px-5 pb-4">
          <Button title="Track this order" onPress={() => router.push("/track")} />
          <Button title="View bag tags" variant="secondary" className="mt-2" onPress={() => router.push(`/bag-tags/${created.id}?bags=${created.bagCount}`)} />
          <Button title="Schedule another" variant="ghost" className="mt-1" onPress={reset} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-navy-900" edges={["top"]}>
      {/* Header + progress */}
      <View className="px-5 pt-2 pb-4">
        <View className="flex-row items-center justify-between">
          {step > 0 ? (
            <Pressable onPress={() => setStep((s) => s - 1)} hitSlop={12}>
              <Ionicons name="chevron-back" size={26} color={colors.ink} />
            </Pressable>
          ) : (
            <View style={{ width: 26 }} />
          )}
          <Text variant="label">
            Step {step + 1} of {STEPS.length}
          </Text>
          <View style={{ width: 26 }} />
        </View>
        <Text variant="title" className="mt-2">
          {STEPS[step]}
        </Text>
        <View className="h-1.5 rounded-full bg-navy-700 mt-3 overflow-hidden">
          <View
            className="h-full bg-orange-500 rounded-full"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </View>
      </View>

      <ScrollView className="flex-1 px-5" contentContainerClassName="pb-6" showsVerticalScrollIndicator={false}>
        {/* ── Step 0: Address ── */}
        {step === 0 && !adding && (
          <View className="gap-3">
            {addresses.map((a) => {
              const selected = a.id === addressId;
              const aRoute = OC_ROUTES.find((r) => r.id === a.routeId);
              return (
                <Pressable key={a.id} onPress={() => setAddressId(a.id)}>
                  <Card elevated={selected} className={selected ? "border-orange-500" : ""}>
                    <View className="flex-row items-center">
                      <Ionicons
                        name={selected ? "radio-button-on" : "radio-button-off"}
                        size={22}
                        color={selected ? colors.orange : colors.inkFaint}
                      />
                      <View className="flex-1 ml-3">
                        <Text variant="heading" className="text-base">
                          {a.label}
                        </Text>
                        <Text variant="caption" className="mt-0.5">
                          {a.line1}, {a.city} {a.zip}
                        </Text>
                      </View>
                      {aRoute ? <Badge label={aRoute.city} tone="navy" /> : null}
                    </View>
                  </Card>
                </Pressable>
              );
            })}
            <Pressable
              onPress={() => setAdding(true)}
              className="rounded-2xl border border-dashed border-navy-500 p-4 flex-row items-center justify-center active:opacity-80"
            >
              <Ionicons name="add" size={20} color={colors.orange} />
              <Text className="text-orange-500 font-semibold ml-2">Add an address</Text>
            </Pressable>
          </View>
        )}

        {step === 0 && adding && (
          <View>
            <View className="flex-row gap-2 mb-4">
              {["Home", "Office", "Other"].map((l) => (
                <Chip key={l} label={l} selected={draft.label === l} onPress={() => setDraft((d) => ({ ...d, label: l }))} />
              ))}
            </View>
            <Input label="Street address" value={draft.line1} onChangeText={(t) => setDraft((d) => ({ ...d, line1: t }))} placeholder="123 Main St" />
            <Input label="City" value={draft.city} onChangeText={(t) => setDraft((d) => ({ ...d, city: t }))} placeholder="Santa Ana" />
            <Input label="ZIP" value={draft.zip} onChangeText={(t) => setDraft((d) => ({ ...d, zip: t }))} placeholder="92705" keyboardType="number-pad" />
            <Text variant="caption" className="mb-4">
              We'll match this address to the nearest Rapidual route automatically.
            </Text>
            <Button title="Save address" onPress={saveNewAddress} />
            <Button title="Cancel" variant="ghost" className="mt-1" onPress={() => setAdding(false)} />
          </View>
        )}

        {/* ── Step 1: Date ── */}
        {step === 1 && (
          <View>
            {addressId && !route ? (
              <Card className="mb-4 flex-row items-center" style={{ borderColor: colors.orange }}>
                <Ionicons name="alert-circle" size={20} color={colors.orange} />
                <Text variant="label" className="ml-3 flex-1">We're not on your street yet — join the waitlist and we'll route to you soon.</Text>
              </Card>
            ) : null}
            {route ? (
              <Card className="mb-4 flex-row items-center">
                <Ionicons name="map" size={20} color={colors.orange} />
                <Text variant="label" className="ml-3 flex-1">
                  {route.name} runs on {dates.length ? shortDate(dates[0]!.toISOString()).split(",")[0] : ""}s
                </Text>
              </Card>
            ) : null}
            <View className="gap-3">
              {dates.map((d) => {
                const iso = d.toISOString();
                const selected = iso === selectedDate;
                const slot = slotStatus(committed[iso] ?? committedFor(iso));
                return (
                  <Pressable key={iso} disabled={slot.full} onPress={() => setSelectedDate(iso)} style={{ opacity: slot.full ? 0.5 : 1 }}>
                    <Card elevated={selected} className={selected ? "border-orange-500" : ""}>
                      <View className="flex-row items-center">
                        <Ionicons
                          name={selected ? "radio-button-on" : "radio-button-off"}
                          size={22}
                          color={selected ? colors.orange : colors.inkFaint}
                        />
                        <View className="ml-3 flex-1">
                          <Text variant="heading" className="text-base">{shortDate(iso)}</Text>
                          <Text variant="caption" className="mt-0.5">Pickup window from {timeOfDay(iso)}</Text>
                        </View>
                        {slot.full ? (
                          <View className="rounded-full bg-navy-600 border border-navy-500 px-3 py-1"><Text className="text-ink-faint text-xs font-semibold">Full</Text></View>
                        ) : (
                          <Text variant="caption" className={slot.almostFull ? "text-orange-400" : "text-ink-muted"}>{slot.remaining} slots left</Text>
                        )}
                      </View>
                    </Card>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* ── Step 2: Bags ── */}
        {step === 2 && (
          <View>
            <Card elevated className="items-center py-8">
              <Text variant="label">Bags this pickup</Text>
              <View className="flex-row items-center mt-4">
                <Pressable
                  onPress={() => setBagCount((b) => Math.max(1, b - 1))}
                  className="w-12 h-12 rounded-full bg-navy-600 border border-navy-500 items-center justify-center active:opacity-80"
                >
                  <Ionicons name="remove" size={24} color={colors.ink} />
                </Pressable>
                <Text variant="display" className="mx-8 w-12 text-center">
                  {bagCount}
                </Text>
                <Pressable
                  onPress={() => setBagCount((b) => b + 1)}
                  className="w-12 h-12 rounded-full bg-orange-500 items-center justify-center active:opacity-80"
                >
                  <Ionicons name="add" size={24} color="#FFFFFF" />
                </Pressable>
              </View>
            </Card>
            <Card className="mt-3">
              <View className="flex-row items-end justify-between">
                <View>
                  <Text variant="caption">PER BAG · APPLIES TO EVERY BAG</Text>
                  <Text variant="title" className="text-orange-400">{currency(quote.effectivePerBag)}</Text>
                </View>
                <View className="items-end">
                  <Text variant="caption">TOTAL</Text>
                  <Text variant="title">{currency(quote.total)}</Text>
                </View>
              </View>
              {quote.savingsVsFlat > 0 ? (
                <View className="self-start rounded-full bg-success/15 px-3 py-1 mt-3">
                  <Text className="text-success text-xs font-semibold">
                    Saving {currency(quote.savingsVsFlat)} vs $7/bag
                  </Text>
                </View>
              ) : null}
              <Pressable
                onPress={() => setBagCount((b) => b + 1)}
                className="flex-row items-center justify-between mt-3 pt-3 border-t border-navy-600/60 active:opacity-80"
              >
                <Text variant="label">Add bag {quote.bags + 1}</Text>
                <View className="flex-row items-center">
                  <Text variant="body" className="text-orange-400 font-semibold">only {currency(quote.nextBagPrice)}</Text>
                  <Ionicons name="add-circle" size={20} color={colors.orange} className="ml-2" />
                </View>
              </Pressable>
            </Card>

            <Card className="mt-3">
              <Text variant="caption" className="tracking-wider mb-2">THE LADDER — MORE BAGS, LOWER PRICE</Text>
              <View className="flex-row gap-2">
                {[1, 2, 3, 4, 5].map((n) => {
                  const active = n === Math.min(quote.bags, 5);
                  const tier = 7 - 0.5 * (n - 1);
                  return (
                    <View key={n} className={`flex-1 items-center rounded-xl py-2 ${active ? "bg-orange-500" : "bg-navy-600"}`}>
                      <Text className={`text-[11px] font-semibold ${active ? "text-white/80" : "text-ink-faint"}`}>{n === 5 ? "5+" : n}</Text>
                      <Text className={`text-sm font-bold ${active ? "text-white" : "text-ink"}`}>${tier.toFixed(2).replace(".00", "")}</Text>
                    </View>
                  );
                })}
              </View>
              <Text variant="caption" className="text-ink-faint mt-3">
                A standard bag holds ~12 lb — about 1.5 machine loads. 3 bags = $18, 5 bags = $25.
              </Text>
            </Card>

            <Card className="mt-3">
              <Pressable onPress={() => setRush((r) => !r)} className="flex-row items-center active:opacity-80">
                <View className={`w-11 h-11 rounded-2xl items-center justify-center ${rush ? "bg-orange-500" : "bg-navy-600"}`}>
                  <Ionicons name="flash" size={20} color={rush ? "#FFFFFF" : colors.inkMuted} />
                </View>
                <View className="flex-1 ml-3">
                  <Text variant="body" className="font-semibold">Same-day rush return</Text>
                  <Text variant="caption" className="text-ink-muted mt-0.5">Back tonight where capacity allows · +{currency(RUSH_FEE)}</Text>
                </View>
                <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${rush ? "bg-orange-500 border-orange-500" : "border-navy-400"}`}>
                  {rush ? <Ionicons name="checkmark" size={14} color="#FFFFFF" /> : null}
                </View>
              </Pressable>
            </Card>

            <Card className="mt-3">
              <Text variant="caption" className="tracking-wider mb-2">ADD TO THIS PICKUP</Text>
              <View className="flex-row gap-2">
                {[
                  { id: "shoe_repair", label: "Shoe repair", icon: "footsteps" as const },
                  { id: "tailoring", label: "Tailoring", icon: "cut" as const },
                ].map((svc) => {
                  const on = addons.includes(svc.id);
                  return (
                    <Pressable
                      key={svc.id}
                      onPress={() => setAddons((a) => (on ? a.filter((x) => x !== svc.id) : [...a, svc.id]))}
                      className={`flex-1 items-center rounded-xl py-3 border ${on ? "bg-orange-500/10 border-orange-500" : "bg-navy-600 border-navy-500"} active:opacity-80`}
                    >
                      <Ionicons name={svc.icon} size={18} color={on ? colors.orange400 : colors.inkMuted} />
                      <Text variant="caption" className={`mt-1 font-medium ${on ? "text-orange-400" : "text-ink-muted"}`}>{svc.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
              <Text variant="caption" className="text-ink-faint mt-3">
                Rides the same pickup — priced per item after inspection at WashHQ.
              </Text>
            </Card>
          </View>
        )}

        {/* ── Step 3: Preferences ── */}
        {step === 3 && (
          <View className="gap-5">
            <View>
              <Text variant="label" className="mb-2">Detergent</Text>
              <View className="flex-row flex-wrap gap-2">
                {DETERGENTS.map((o) => (
                  <Chip key={o.v} label={o.label} selected={prefs.detergent === o.v} onPress={() => setPrefs((p) => ({ ...p, detergent: o.v }))} />
                ))}
              </View>
            </View>
            <View>
              <Text variant="label" className="mb-2">Fold style</Text>
              <View className="flex-row flex-wrap gap-2">
                {FOLDS.map((o) => (
                  <Chip key={o.v} label={o.label} selected={prefs.fold === o.v} onPress={() => setPrefs((p) => ({ ...p, fold: o.v }))} />
                ))}
              </View>
            </View>
            <View>
              <Text variant="label" className="mb-2">Water temperature</Text>
              <View className="flex-row flex-wrap gap-2">
                {TEMPS.map((o) => (
                  <Chip key={o.v} label={o.label} selected={prefs.waterTemp === o.v} onPress={() => setPrefs((p) => ({ ...p, waterTemp: o.v }))} />
                ))}
              </View>
            </View>
            <Card className="gap-3">
              <Pressable className="flex-row items-center justify-between" onPress={() => setPrefs((p) => ({ ...p, separateDelicates: !p.separateDelicates }))}>
                <Text variant="body">Separate delicates</Text>
                <Ionicons name={prefs.separateDelicates ? "toggle" : "toggle-outline"} size={32} color={prefs.separateDelicates ? colors.orange : colors.inkFaint} />
              </Pressable>
              <Pressable className="flex-row items-center justify-between" onPress={() => setPrefs((p) => ({ ...p, starchShirts: !p.starchShirts }))}>
                <Text variant="body">Starch shirts</Text>
                <Ionicons name={prefs.starchShirts ? "toggle" : "toggle-outline"} size={32} color={prefs.starchShirts ? colors.orange : colors.inkFaint} />
              </Pressable>
            </Card>
            <Input label="Notes for your driver" value={prefs.notes ?? ""} onChangeText={(t) => setPrefs((p) => ({ ...p, notes: t }))} placeholder="Leave bins by the side gate…" multiline />
          </View>
        )}

        {/* ── Step 4: Review ── */}
        {step === 4 && (
          <View className="gap-3">
            <Card>
              <Row icon="location" label="Address" value={`${selectedAddress?.label} · ${selectedAddress?.line1}`} />
              <Divider />
              <Row icon="map" label="Route" value={route?.name ?? "—"} />
              <Divider />
              <Row icon="calendar" label="Pickup" value={selectedDate ? shortDate(selectedDate) : "—"} />
              <Divider />
              <Row icon="bag-handle" label="Bags" value={String(bagCount)} />
              <Divider />
              <Row icon="water" label="Wash" value={`${labelOf(DETERGENTS, prefs.detergent)} · ${labelOf(TEMPS, prefs.waterTemp)} · ${labelOf(FOLDS, prefs.fold)}`} />
            </Card>
            <Pressable onPress={() => setRepeatWeekly((v) => !v)}>
              <Card className="flex-row items-center">
                <View className="w-10 h-10 rounded-full bg-orange-500/15 items-center justify-center"><Ionicons name="repeat" size={18} color={colors.orange} /></View>
                <View className="flex-1 ml-3">
                  <Text variant="heading" className="text-base">Repeat this weekly</Text>
                  <Text variant="caption" className="mt-0.5">Same day, same bags — pay per bag, cancel anytime</Text>
                </View>
                <Ionicons name={repeatWeekly ? "toggle" : "toggle-outline"} size={38} color={repeatWeekly ? colors.orange : colors.inkFaint} />
              </Card>
            </Pressable>

            <SavingsPanel
              bagCount={bagCount}
              orderTotal={quote.total}
              promoCode={promoCode}
              setPromoCode={setPromoCode}
              applyPromo={applyPromo}
              promoNote={promoNote}
              promoActive={!!promoKind}
              discount={discount}
              dueNow={dueNow}
              pointsToEarn={pointsToEarn}
            />
          </View>
        )}
      </ScrollView>

      {/* Footer */}
      {step < 5 && !(step === 0 && adding) ? (
        <View className="px-5 pb-4 pt-3 bg-navy-800 border-t border-navy-500">
          {payError ? <Text className="text-danger text-sm mb-2 text-center">{payError}</Text> : null}
          {step >= 2 ? (
            <View className="flex-row items-center justify-between mb-2">
              <Text variant="caption" className="text-ink-muted">
                {quote.bags} bag{quote.bags === 1 ? "" : "s"} · {currency(quote.effectivePerBag)}/bag{rush ? " · rush" : ""}
              </Text>
              <Text variant="body" className="font-bold">{currency(dueNow)}</Text>
            </View>
          ) : null}
          {step < 4 ? (
            <Button title="Continue" disabled={!canContinue} onPress={() => setStep((s) => s + 1)} />
          ) : (
            <Button title={`Confirm pickup · ${currency(dueNow)}`} loading={submitting} onPress={confirm} />
          )}
        </View>
      ) : null}
    </SafeAreaView>
  );
}

function Divider() {
  return <View className="h-px bg-navy-600/60 my-3" />;
}

function Row({ icon, label, value }: { icon: keyof typeof import("@expo/vector-icons").Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View className="flex-row items-center">
      <Ionicons name={icon} size={18} color={colors.inkMuted} />
      <Text variant="label" className="ml-3 w-20">{label}</Text>
      <Text variant="body" className="flex-1 text-right">{value}</Text>
    </View>
  );
}
