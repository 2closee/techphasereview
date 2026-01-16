import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.168.0/crypto/mod.ts";

serve(async (req) => {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const body = await req.text();
    const signature = req.headers.get('x-paystack-signature');
    
    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!paystackSecretKey) {
      console.error('PAYSTACK_SECRET_KEY not configured');
      return new Response('Configuration error', { status: 500 });
    }

    // Verify webhook signature
    const hash = createHmac('sha512', paystackSecretKey)
      .update(body)
      .toString('hex');

    if (hash !== signature) {
      console.error('Invalid webhook signature');
      return new Response('Invalid signature', { status: 401 });
    }

    const event = JSON.parse(body);
    console.log('Webhook event received:', event.event);

    // Only process successful charge events
    if (event.event !== 'charge.success') {
      console.log('Ignoring non-success event:', event.event);
      return new Response('OK', { status: 200 });
    }

    const paymentData = event.data;
    const reference = paymentData.reference;
    const registrationId = paymentData.metadata?.registration_id;

    console.log('Processing successful payment:', reference, 'for registration:', registrationId);

    if (!registrationId) {
      console.error('No registration_id in payment metadata');
      return new Response('OK', { status: 200 }); // Acknowledge but log error
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Update payment record
    const { error: updatePaymentError } = await supabase
      .from('enrollment_payments')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        metadata: {
          paystack_webhook: paymentData,
          webhook_received_at: new Date().toISOString(),
        }
      })
      .eq('payment_reference', reference);

    if (updatePaymentError) {
      console.error('Error updating payment record:', updatePaymentError);
    }

    // Update registration
    const { error: updateRegError } = await supabase
      .from('student_registrations')
      .update({ 
        payment_status: 'paid',
        status: 'approved'
      })
      .eq('id', registrationId);

    if (updateRegError) {
      console.error('Error updating registration:', updateRegError);
      return new Response('Error updating registration', { status: 500 });
    }

    console.log('Webhook processed successfully');
    return new Response('OK', { status: 200 });

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response('Internal error', { status: 500 });
  }
});
