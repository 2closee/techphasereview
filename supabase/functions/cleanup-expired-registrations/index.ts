import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify caller is admin (or allow cron via service role)
    const authHeader = req.headers.get("Authorization");
    const adminClient = createClient(
      Deno.env.get("LMS_SUPABASE_URL")!,
      Deno.env.get("LMS_SUPABASE_SERVICE_ROLE_KEY")!
    );

    // If auth header present, verify admin role
    if (authHeader?.startsWith("Bearer ")) {
      const anonClient = createClient(
        Deno.env.get("LMS_SUPABASE_URL")!,
        Deno.env.get("LMS_SUPABASE_SERVICE_ROLE_KEY")!,
        { global: { headers: { Authorization: authHeader } } }
      );

      const token = authHeader.replace("Bearer ", "");
      const { data: claims, error: claimsErr } = await anonClient.auth.getClaims(token);
      if (claimsErr || !claims?.claims) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
      }

      const callerId = claims.claims.sub as string;
      const { data: callerRoles } = await adminClient
        .from("user_roles")
        .select("role")
        .eq("user_id", callerId)
        .in("role", ["admin", "super_admin"]);

      if (!callerRoles || callerRoles.length === 0) {
        return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });
      }
    }

    // Get deadline from settings (default 7 days)
    let deadlineDays = 7;
    const { data: setting } = await adminClient
      .from("settings")
      .select("value")
      .eq("key", "registration_expiry_days")
      .single();

    if (setting?.value) {
      const val = typeof setting.value === "number" ? setting.value : parseInt(String(setting.value), 10);
      if (!isNaN(val) && val > 0) deadlineDays = val;
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - deadlineDays);

    // Find expired unpaid registrations
    const { data: expired, error: findErr } = await adminClient
      .from("student_registrations")
      .select("id")
      .eq("payment_status", "pending")
      .is("user_id", null)
      .lt("created_at", cutoffDate.toISOString());

    if (findErr) {
      return new Response(JSON.stringify({ error: findErr.message }), { status: 500, headers: corsHeaders });
    }

    const count = expired?.length || 0;

    if (count > 0) {
      const ids = expired!.map((r: any) => r.id);
      const { error: delErr } = await adminClient
        .from("student_registrations")
        .delete()
        .in("id", ids);

      if (delErr) {
        return new Response(JSON.stringify({ error: delErr.message }), { status: 500, headers: corsHeaders });
      }
    }

    // Log the cleanup
    await adminClient.from("cleanup_logs").insert({
      records_deleted: count,
      details: { deadline_days: deadlineDays, cutoff_date: cutoffDate.toISOString(), deleted_ids: expired?.map((r: any) => r.id) || [] },
    });

    return new Response(
      JSON.stringify({ success: true, records_deleted: count, deadline_days: deadlineDays }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
