import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { registration_id, callback_url } = await req.json();

    if (!registration_id) {
      console.error('Missing registration_id');
      return new Response(
        JSON.stringify({ error: 'registration_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Initializing payment for registration:', registration_id);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('LMS_SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('LMS_SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch registration details with program info
    const { data: registration, error: fetchError } = await supabase
      .from('student_registrations')
      .select(`
        id,
        first_name,
        last_name,
        email,
        program_id,
        payment_status,
        programs:program_id (
          name,
          tuition_fee,
          registration_fee
        )
      `)
      .eq('id', registration_id)
      .single();

    if (fetchError || !registration) {
      console.error('Registration not found:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Registration not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if already paid
    if (registration.payment_status === 'paid') {
      console.log('Registration already paid');
      return new Response(
        JSON.stringify({ error: 'Payment already completed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate total amount (tuition + registration fee) in kobo (Paystack uses kobo)
    const program = registration.programs as { name: string; tuition_fee: number; registration_fee: number | null };
    const totalAmount = (program.tuition_fee || 0) + (program.registration_fee || 0);
    const amountInKobo = totalAmount * 100;

    console.log('Payment amount:', totalAmount, 'NGN (', amountInKobo, 'kobo)');

    // Initialize Paystack transaction
    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!paystackSecretKey) {
      console.error('PAYSTACK_SECRET_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Payment service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const paystackPayload = {
      email: registration.email,
      amount: amountInKobo,
      currency: 'NGN',
      reference: `ENR-${registration_id}-${Date.now()}`,
      callback_url: callback_url || `${req.headers.get('origin')}/complete-enrollment?registration_id=${registration_id}`,
      metadata: {
        registration_id: registration_id,
        student_name: `${registration.first_name} ${registration.last_name}`,
        program_name: program.name,
        custom_fields: [
          {
            display_name: "Student Name",
            variable_name: "student_name",
            value: `${registration.first_name} ${registration.last_name}`
          },
          {
            display_name: "Program",
            variable_name: "program",
            value: program.name
          }
        ]
      }
    };

    console.log('Calling Paystack initialize...');

    const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paystackPayload),
    });

    const paystackData = await paystackResponse.json();

    if (!paystackResponse.ok || !paystackData.status) {
      console.error('Paystack initialization failed:', paystackData);
      return new Response(
        JSON.stringify({ error: paystackData.message || 'Failed to initialize payment' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Paystack initialization successful, reference:', paystackData.data.reference);

    // Store payment record
    const { error: paymentError } = await supabase
      .from('enrollment_payments')
      .insert({
        registration_id: registration_id,
        payment_reference: paystackData.data.reference,
        payment_provider: 'paystack',
        amount: totalAmount,
        currency: 'NGN',
        status: 'pending',
        metadata: {
          access_code: paystackData.data.access_code,
          authorization_url: paystackData.data.authorization_url,
        }
      });

    if (paymentError) {
      console.error('Error storing payment record:', paymentError);
      // Continue anyway - payment can still proceed
    }

    return new Response(
      JSON.stringify({
        authorization_url: paystackData.data.authorization_url,
        access_code: paystackData.data.access_code,
        reference: paystackData.data.reference,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in paystack-initialize:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
