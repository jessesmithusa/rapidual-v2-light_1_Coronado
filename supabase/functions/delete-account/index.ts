import { userClient, adminClient } from "../_shared/clients.ts";
import { corsHeaders, json } from "../_shared/cors.ts";

// Full account deletion (App Store requirement). Verifies the caller's JWT,
// then removes the auth user — every owned row cascades via FK constraints.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { confirm } = await req.json();
    if (confirm !== "DELETE") return json({ ok: false, message: "Send { confirm: \"DELETE\" }" }, 400);

    const { data: { user } } = await userClient(req).auth.getUser();
    if (!user) return json({ ok: false, message: "Not authenticated" }, 401);

    const { error } = await adminClient.auth.admin.deleteUser(user.id);
    if (error) return json({ ok: false, message: error.message }, 500);
    return json({ ok: true });
  } catch (e) {
    return json({ ok: false, message: e instanceof Error ? e.message : "Error" }, 500);
  }
});
