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
    const { email, password, full_name, setup_secret } = await req.json();

    // Verify setup secret to prevent unauthorized bootstrap
    const expectedSecret = Deno.env.get("BOOTSTRAP_ADMIN_SECRET");
    if (!expectedSecret || setup_secret !== expectedSecret) {
      return new Response(JSON.stringify({ error: "Invalid setup secret" }), { status: 403, headers: corsHeaders });
    }

    if (!email || !password || !full_name) {
      return new Response(JSON.stringify({ error: "Missing required fields: email, password, full_name" }), { status: 400, headers: corsHeaders });
    }

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if any super_admin already exists
    const { data: existingAdmins } = await adminClient
      .from("user_roles")
      .select("id")
      .eq("role", "super_admin")
      .limit(1);

    if (existingAdmins && existingAdmins.length > 0) {
      return new Response(JSON.stringify({ error: "A super_admin already exists. Bootstrap is disabled." }), { status: 409, headers: corsHeaders });
    }

    // Create the super_admin user
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

    // Assign super_admin role
    await adminClient.from("user_roles").insert({
      user_id: newUser.user.id,
      role: "super_admin",
    });

    return new Response(
      JSON.stringify({ success: true, user_id: newUser.user.id, message: "Super admin bootstrapped successfully" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
