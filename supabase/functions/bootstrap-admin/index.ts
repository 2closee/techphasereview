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

    const expectedSecret = Deno.env.get("BOOTSTRAP_ADMIN_SECRET");
    if (!expectedSecret || setup_secret !== expectedSecret) {
      return new Response(JSON.stringify({ error: "Invalid setup secret" }), { status: 403, headers: corsHeaders });
    }

    if (!email || !password || !full_name) {
      return new Response(JSON.stringify({ error: "Missing required fields: email, password, full_name" }), { status: 400, headers: corsHeaders });
    }

    const lmsUrl = Deno.env.get("LMS_SUPABASE_URL");
    const lmsServiceKey = Deno.env.get("LMS_SUPABASE_SERVICE_ROLE_KEY");
    console.log("LMS_SUPABASE_URL value:", JSON.stringify(lmsUrl));
    console.log("LMS_SUPABASE_SERVICE_ROLE_KEY exists:", !!lmsServiceKey);
    if (!lmsUrl || !lmsServiceKey) {
      return new Response(JSON.stringify({ error: "LMS Supabase credentials not configured" }), { status: 500, headers: corsHeaders });
    }
    const adminClient = createClient(lmsUrl, lmsServiceKey);

    // Check if any super_admin already exists
    const { data: existingAdmins } = await adminClient
      .from("user_roles")
      .select("id")
      .eq("role", "super_admin")
      .limit(1);

    if (existingAdmins && existingAdmins.length > 0) {
      return new Response(JSON.stringify({ error: "A super_admin already exists. Bootstrap is disabled." }), { status: 409, headers: corsHeaders });
    }

    // Try to create the user, or find existing one
    let userId: string;
    const { data: newUser, error: createErr } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name },
    });

    if (createErr) {
      // If user already exists, look them up
      if (createErr.message.includes("already been registered")) {
        const { data: { users }, error: listErr } = await adminClient.auth.admin.listUsers();
        if (listErr) {
          return new Response(JSON.stringify({ error: listErr.message }), { status: 500, headers: corsHeaders });
        }
        const existingUser = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
        if (!existingUser) {
          return new Response(JSON.stringify({ error: "User exists but could not be found" }), { status: 404, headers: corsHeaders });
        }
        userId = existingUser.id;
      } else {
        return new Response(JSON.stringify({ error: createErr.message }), { status: 400, headers: corsHeaders });
      }
    } else {
      userId = newUser.user.id;
    }

    // Upsert profile
    await adminClient.from("profiles").upsert({
      id: userId,
      email,
      full_name,
    });

    // Assign super_admin role
    await adminClient.from("user_roles").upsert({
      user_id: userId,
      role: "super_admin",
    }, { onConflict: "user_id,role" });

    return new Response(
      JSON.stringify({ success: true, user_id: userId, message: "Super admin bootstrapped successfully" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
