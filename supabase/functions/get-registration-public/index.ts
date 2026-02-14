import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { registration_id, update_payment_status, update_payment_plan } = body;

    if (!registration_id) {
      return new Response(
        JSON.stringify({ error: 'registration_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(registration_id)) {
      return new Response(
        JSON.stringify({ error: 'Invalid registration_id format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle update operations (pay at office, payment plan)
    if (update_payment_status || update_payment_plan) {
      const updateData: Record<string, string> = {};
      
      if (update_payment_status) {
        const allowedStatuses = ['office_pending'];
        if (!allowedStatuses.includes(update_payment_status)) {
          return new Response(
            JSON.stringify({ error: 'Invalid payment status' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        updateData.payment_status = update_payment_status;
      }
      
      if (update_payment_plan) {
        const allowedPlans = ['full', '2_installments', '3_installments', 'office_pay'];
        if (!allowedPlans.includes(update_payment_plan)) {
          return new Response(
            JSON.stringify({ error: 'Invalid payment plan' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        updateData.payment_plan = update_payment_plan;
      }

      const { error: updateError } = await supabase
        .from('student_registrations')
        .update(updateData)
        .eq('id', registration_id);

      if (updateError) {
        console.error('Update error:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to update registration' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch registration with program info
    const { data: registration, error: fetchError } = await supabase
      .from('student_registrations')
      .select(`
        id,
        first_name,
        last_name,
        email,
        program_id,
        payment_status,
        account_created,
        payment_plan,
        programs:program_id (
          name,
          tuition_fee,
          registration_fee
        )
      `)
      .eq('id', registration_id)
      .maybeSingle();

    if (fetchError) {
      console.error('Database error:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch registration' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!registration) {
      return new Response(
        JSON.stringify({ error: 'Registration not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ registration }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-registration-public:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
