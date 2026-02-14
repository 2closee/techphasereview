import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { reference } = await req.json();

    if (!reference) {
      console.error('Missing payment reference');
      return new Response(
        JSON.stringify({ error: 'Payment reference is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Verifying payment reference:', reference);

    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!paystackSecretKey) {
      console.error('PAYSTACK_SECRET_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Payment service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify with Paystack
    const verifyResponse = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
      },
    });

    const verifyData = await verifyResponse.json();
    console.log('Paystack verify response:', verifyData.status, verifyData.data?.status);

    if (!verifyResponse.ok || !verifyData.status) {
      console.error('Paystack verification failed:', verifyData);
      return new Response(
        JSON.stringify({ 
          error: verifyData.message || 'Payment verification failed',
          verified: false 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const paymentData = verifyData.data;
    const isSuccessful = paymentData.status === 'success';

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get registration_id from payment record or metadata
    let registrationId = paymentData.metadata?.registration_id;

    if (!registrationId) {
      // Try to find it from our payment records
      const { data: paymentRecord } = await supabase
        .from('enrollment_payments')
        .select('registration_id')
        .eq('payment_reference', reference)
        .single();
      
      registrationId = paymentRecord?.registration_id;
    }

    if (!registrationId) {
      console.error('Could not find registration_id for reference:', reference);
      return new Response(
        JSON.stringify({ error: 'Registration not found for this payment' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update payment record
    const { error: updatePaymentError } = await supabase
      .from('enrollment_payments')
      .update({
        status: isSuccessful ? 'completed' : 'failed',
        completed_at: isSuccessful ? new Date().toISOString() : null,
        metadata: {
          paystack_response: paymentData,
          verified_at: new Date().toISOString(),
        }
      })
      .eq('payment_reference', reference);

    if (updatePaymentError) {
      console.error('Error updating payment record:', updatePaymentError);
    }

    // If successful, update registration payment_status
    if (isSuccessful) {
      console.log('Payment successful, updating registration:', registrationId);
      
      // Check total paid vs total fee to determine if fully paid or partial
      const { data: regData } = await supabase
        .from('student_registrations')
        .select('payment_plan, programs:program_id (tuition_fee, registration_fee)')
        .eq('id', registrationId)
        .single();

      const { data: allPayments } = await supabase
        .from('enrollment_payments')
        .select('amount, status')
        .eq('registration_id', registrationId)
        .eq('status', 'completed');

      const program = regData?.programs as { tuition_fee: number; registration_fee: number | null } | null;
      const totalFee = (program?.tuition_fee || 0) + (program?.registration_fee || 0);
      const totalPaid = (allPayments || []).reduce((sum: number, p: any) => sum + Number(p.amount), 0);
      const isFullyPaid = totalPaid >= totalFee;
      const paymentPlan = regData?.payment_plan || 'full';

      const newStatus = isFullyPaid ? 'paid' : 'partial';

      const { error: updateRegError } = await supabase
        .from('student_registrations')
        .update({ 
          payment_status: newStatus,
          status: (isFullyPaid || paymentPlan !== 'full') ? 'approved' : 'approved'
        })
        .eq('id', registrationId);

      if (updateRegError) {
        console.error('Error updating registration:', updateRegError);
        return new Response(
          JSON.stringify({ 
            error: 'Payment verified but failed to update registration',
            verified: true,
            payment_successful: true 
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Registration updated successfully, status:', newStatus);
    }

    return new Response(
      JSON.stringify({
        verified: true,
        payment_successful: isSuccessful,
        registration_id: registrationId,
        amount: paymentData.amount / 100, // Convert from kobo to naira
        currency: paymentData.currency,
        paid_at: paymentData.paid_at,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in paystack-verify:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
