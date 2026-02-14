import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { registration_id, password } = await req.json();

    if (!registration_id || !password) {
      return new Response(
        JSON.stringify({ error: "registration_id and password are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (password.length < 8) {
      return new Response(
        JSON.stringify({ error: "Password must be at least 8 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // 1. Fetch registration
    const { data: registration, error: regError } = await adminClient
      .from("student_registrations")
      .select("id, email, first_name, last_name, account_created, user_id")
      .eq("id", registration_id)
      .maybeSingle();

    if (regError || !registration) {
      return new Response(
        JSON.stringify({ error: "Registration not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (registration.account_created) {
      return new Response(
        JSON.stringify({ error: "Account already created for this registration" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const email = registration.email;
    const fullName = `${registration.first_name} ${registration.last_name}`;
    let userId: string;

    // 2. Check if user already exists
    const { data: existingUsers } = await adminClient.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      (u: any) => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (existingUser) {
      userId = existingUser.id;
    } else {
      // 3. Create new user with email auto-confirmed
      const { data: newUser, error: createErr } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      });

      if (createErr) {
        return new Response(
          JSON.stringify({ error: createErr.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      userId = newUser.user.id;
    }

    // 4. Upsert profile
    await adminClient.from("profiles").upsert({
      id: userId,
      email,
      full_name: fullName,
    });

    // 5. Assign student role (skip if already exists)
    const { data: existingRole } = await adminClient
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .eq("role", "student")
      .maybeSingle();

    if (!existingRole) {
      const { error: roleErr } = await adminClient
        .from("user_roles")
        .insert({ user_id: userId, role: "student" });

      if (roleErr) {
        console.error("Role assignment error:", roleErr);
      }
    }

    // 6. Link registration to user
    const { error: updateErr } = await adminClient
      .from("student_registrations")
      .update({ user_id: userId, account_created: true })
      .eq("id", registration_id);

    if (updateErr) {
      console.error("Registration update error:", updateErr);
    }

    return new Response(
      JSON.stringify({ success: true, email }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("create-student-account error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
