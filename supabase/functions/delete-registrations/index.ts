import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceRoleKey);

    // 1. Authenticate the caller from their bearer token
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!token) return json({ error: "Not authenticated" }, 401);

    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    const caller = userData?.user;
    if (userErr || !caller) return json({ error: "Not authenticated" }, 401);

    // 2. Authorize: admin or super_admin only
    const { data: roles, error: roleErr } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id);

    if (roleErr) {
      console.error("Role lookup error:", roleErr);
      return json({ error: "Failed to verify permissions" }, 500);
    }

    const isAdmin = (roles ?? []).some(
      (r: { role: string }) => r.role === "admin" || r.role === "super_admin",
    );
    if (!isAdmin) return json({ error: "Admins only" }, 403);

    // 3. Validate input
    const body = await req.json().catch(() => ({}));
    const all = body?.all === true;
    const rawIds: unknown = body?.registration_ids;
    let ids: string[] = [];

    if (!all) {
      if (!Array.isArray(rawIds) || rawIds.length === 0) {
        return json({ error: "registration_ids is required" }, 400);
      }
      if (rawIds.length > 500) {
        return json({ error: "Too many registrations in one request (max 500)" }, 400);
      }
      ids = rawIds.filter((id): id is string => typeof id === "string" && UUID_RE.test(id));
      if (ids.length === 0) return json({ error: "No valid registration ids provided" }, 400);
    }

    // 4. Re-read server side and keep ONLY rejected registrations
    let query = admin
      .from("student_registrations")
      .select("id, user_id, status, email")
      .eq("status", "rejected");
    if (!all) query = query.in("id", ids);

    const { data: targets, error: fetchErr } = await query;
    if (fetchErr) {
      console.error("Registration lookup error:", fetchErr);
      return json({ error: "Failed to load registrations" }, 500);
    }

    const rows = targets ?? [];
    const skipped = all ? 0 : ids.length - rows.length;

    if (rows.length === 0) {
      return json({ deleted: 0, skipped, message: "No rejected registrations matched" });
    }

    const targetIds = rows.map((r: { id: string }) => r.id);

    // 5. Delete child rows that do not cascade
    const { error: schErr } = await admin
      .from("scholarship_applications")
      .delete()
      .in("student_id", targetIds);
    if (schErr) {
      console.error("Scholarship cleanup error:", schErr);
      return json({ error: "Failed to remove linked scholarship applications" }, 500);
    }

    // 6. Delete the registrations (remaining child tables cascade)
    const { error: delErr } = await admin
      .from("student_registrations")
      .delete()
      .in("id", targetIds);
    if (delErr) {
      console.error("Registration delete error:", delErr);
      return json({ error: "Failed to delete registrations: " + delErr.message }, 500);
    }

    // 7. Remove linked login accounts (profile cascades from auth.users)
    let accountsDeleted = 0;
    for (const row of rows as { id: string; user_id: string | null }[]) {
      if (!row.user_id) continue;

      const { error: roleDelErr } = await admin
        .from("user_roles")
        .delete()
        .eq("user_id", row.user_id);
      if (roleDelErr) console.error("Role delete error:", roleDelErr);

      const { error: authErr } = await admin.auth.admin.deleteUser(row.user_id);
      if (authErr) {
        console.error(`Auth user delete error for ${row.user_id}:`, authErr);
      } else {
        accountsDeleted++;
      }
    }

    console.log(
      `Admin ${caller.id} deleted ${targetIds.length} rejected registration(s), ${accountsDeleted} login account(s)`,
    );

    return json({ deleted: targetIds.length, accounts_deleted: accountsDeleted, skipped });
  } catch (err) {
    console.error("delete-registrations error:", err);
    return json({ error: (err as Error).message ?? "Internal server error" }, 500);
  }
});
