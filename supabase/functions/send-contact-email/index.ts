/**
 * ShadowTalk AI — Contact Email Edge Function
 * 
 * Sends contact form submissions and job applications via Resend.
 * Set RESEND_API_KEY in Supabase secrets.
 */

import { Resend } from 'https://esm.sh/resend@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'noreply@shadowtalk-ai.com';
    const TO_EMAIL = Deno.env.get('CONTACT_EMAIL') || 'founder@shadowtalk-ai.com';

    if (!RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { type, name, email, subject, message, ...rest } = body;

    const resend = new Resend(RESEND_API_KEY);

    if (type === 'job_application') {
      // Job application email
      await resend.emails.send({
        from: `ShadowTalk Careers <${FROM_EMAIL}>`,
        to: [TO_EMAIL],
        subject: `Job Application: ${rest.position || subject}`,
        html: `
          <h2>New Job Application</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Position:</strong> ${rest.position || 'N/A'}</p>
          <p><strong>Resume:</strong> ${rest.resume_url || 'Not provided'}</p>
          <hr>
          <p><strong>Cover Letter / Message:</strong></p>
          <p>${message || 'No message provided'}</p>
        `,
      });
    } else {
      // Contact form email
      await resend.emails.send({
        from: `ShadowTalk Contact <${FROM_EMAIL}>`,
        to: [TO_EMAIL],
        subject: `Contact: ${subject || 'General Inquiry'}`,
        html: `
          <h2>New Contact Message</h2>
          <p><strong>Name:</strong> ${name || 'Anonymous'}</p>
          <p><strong>Email:</strong> ${email || 'Not provided'}</p>
          <hr>
          <p><strong>Message:</strong></p>
          <p>${message}</p>
        `,
      });
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Email send error:', err);
    return new Response(
      JSON.stringify({ error: 'Failed to send email' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
