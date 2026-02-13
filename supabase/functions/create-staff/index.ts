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
    // Verify caller is admin/super_admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

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

    // Check caller has admin or super_admin role
    const adminClient = createClient(
      Deno.env.get("LMS_SUPABASE_URL")!,
      Deno.env.get("LMS_SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: callerRoles } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId)
      .in("role", ["admin", "super_admin"]);

    if (!callerRoles || callerRoles.length === 0) {
      return new Response(JSON.stringify({ error: "Forbidden: admin role required" }), { status: 403, headers: corsHeaders });
    }

    const { email, password, full_name, role } = await req.json();

    if (!email || !password || !full_name || !role) {
      return new Response(JSON.stringify({ error: "Missing required fields: email, password, full_name, role" }), { status: 400, headers: corsHeaders });
    }

    const validRoles = ["admin", "teacher", "accountant", "super_admin"];
    if (!validRoles.includes(role)) {
      return new Response(JSON.stringify({ error: `Invalid role. Must be one of: ${validRoles.join(", ")}` }), { status: 400, headers: corsHeaders });
    }

    // Only super_admin can create super_admin or admin
    if ((role === "super_admin" || role === "admin") && !callerRoles.some((r: any) => r.role === "super_admin")) {
      // Allow admin to create admin (same level), but not super_admin
      if (role === "super_admin") {
        return new Response(JSON.stringify({ error: "Only super_admin can create super_admin accounts" }), { status: 403, headers: corsHeaders });
      }
    }

    // Create user via Admin API (bypasses email confirmation)
    const { data: newUser, error: createErr } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name },
    });

    if (createErr) {
      return new Response(JSON.stringify({ error: createErr.message }), { status: 400, headers: corsHeaders });
    }

    // Create profile
    await adminClient.from("profiles").upsert({
      id: newUser.user.id,
      email,
      full_name,
    });

    // Assign role
    const { error: roleErr } = await adminClient.from("user_roles").insert({
      user_id: newUser.user.id,
      role,
    });

    if (roleErr) {
      return new Response(JSON.stringify({ error: roleErr.message }), { status: 500, headers: corsHeaders });
    }

    return new Response(
      JSON.stringify({ success: true, user_id: newUser.user.id, message: `Staff member created with role: ${role}` }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
