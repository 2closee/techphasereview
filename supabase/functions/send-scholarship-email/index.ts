import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured');
    }

    const { to, studentName, status, grantedPercentage, programName, adminNotes } = await req.json();

    if (!to || !studentName || !status || !programName) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, studentName, status, programName' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const subject = status === 'approved'
      ? `🎉 Scholarship Approved — ${programName}`
      : `Scholarship Application Update — ${programName}`;

    const htmlBody = status === 'approved'
      ? `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">🎉 Congratulations!</h1>
          </div>
          <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <p style="font-size: 16px; color: #374151;">Dear <strong>${studentName}</strong>,</p>
            <p style="font-size: 16px; color: #374151;">
              We are pleased to inform you that your scholarship application for <strong>${programName}</strong> has been <strong style="color: #059669;">approved</strong>!
            </p>
            <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
              <p style="margin: 0; color: #065f46; font-size: 14px;">Your Tuition Discount</p>
              <p style="margin: 5px 0 0; color: #059669; font-size: 36px; font-weight: bold;">${grantedPercentage}%</p>
            </div>
            <h3 style="color: #374151;">Next Steps:</h3>
            <ul style="color: #6b7280; line-height: 1.8;">
              <li>Log in to your student dashboard to view updated payment details</li>
              <li>Your tuition balance has been adjusted to reflect the scholarship discount</li>
              <li>Contact the office if you have any questions</li>
            </ul>
            ${adminNotes ? `<p style="color: #6b7280; font-style: italic; border-left: 3px solid #d1d5db; padding-left: 12px; margin-top: 20px;">Note: ${adminNotes}</p>` : ''}
            <p style="color: #374151; margin-top: 24px;">Best regards,<br/><strong>TechPhase Academy</strong></p>
          </div>
        </div>
      `
      : `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #374151; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Scholarship Application Update</h1>
          </div>
          <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <p style="font-size: 16px; color: #374151;">Dear <strong>${studentName}</strong>,</p>
            <p style="font-size: 16px; color: #374151;">
              Thank you for applying for a scholarship for <strong>${programName}</strong>. After careful review, we regret to inform you that your application was not approved at this time.
            </p>
            ${adminNotes ? `<div style="background: #f3f4f6; border-radius: 8px; padding: 16px; margin: 20px 0;"><p style="margin: 0; color: #374151; font-size: 14px;"><strong>Reviewer's Note:</strong> ${adminNotes}</p></div>` : ''}
            <p style="color: #6b7280;">
              This does not affect your enrollment. You may reach out to the office for further guidance on payment plans or future scholarship opportunities.
            </p>
            <p style="color: #374151; margin-top: 24px;">Best regards,<br/><strong>TechPhase Academy</strong></p>
          </div>
        </div>
      `;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'TechPhase Academy <onboarding@resend.dev>',
        to: [to],
        subject,
        html: htmlBody,
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      console.error('Resend API error:', result);
      return new Response(
        JSON.stringify({ error: 'Failed to send email', details: result }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, id: result.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in send-scholarship-email:', error);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
