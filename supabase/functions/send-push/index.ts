import { adminClient } from "../_shared/clients.ts";
import { corsHeaders, json } from "../_shared/cors.ts";

// Sends a push to all of a user's devices via Expo's push API and mirrors it
// into the in-app inbox. Call it from other functions, a DB webhook, or ops
// tooling with the service-role key. Requires PUSH_FN_SECRET so the anon key
// alone can't spam users.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    if (req.headers.get("x-push-secret") !== Deno.env.get("PUSH_FN_SECRET"))
      return json({ ok: false, message: "Forbidden" }, 403);

    const { userId, title, body, icon } = await req.json();
    if (!userId || !title || !body) return json({ ok: false, message: "userId, title, body required" }, 400);

    // Mirror into the in-app inbox regardless of device reachability.
    await adminClient.from("notifications").insert({ user_id: userId, title, body, icon: icon ?? "notifications" });

    const { data: tokens } = await adminClient.from("push_tokens").select("token").eq("user_id", userId);
    if (!tokens || tokens.length === 0) return json({ ok: true, delivered: 0, note: "No registered devices" });

    const res = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tokens.map((t) => ({ to: t.token, title, body, sound: "default" }))),
    });
    const out = await res.json();
    return json({ ok: true, delivered: tokens.length, expo: out });
  } catch (e) {
    return json({ ok: false, message: e instanceof Error ? e.message : "Error" }, 500);
  }
});
