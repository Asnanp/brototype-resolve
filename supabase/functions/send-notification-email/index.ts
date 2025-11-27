import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string;
  subject: string;
  message: string;
  complaintId?: string;
  ticketNumber?: string;
  type: 'status_change' | 'new_comment' | 'assignment' | 'sla_warning';
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { to, subject, message, complaintId, ticketNumber, type }: EmailRequest = await req.json();

    console.log("Sending email notification:", { to, subject, type });

    // Check user's email preferences
    const { data: preferences } = await supabase
      .from("email_preferences")
      .select("*")
      .eq("user_id", to)
      .single();

    // Check if user wants this type of notification
    const shouldSend = 
      !preferences ||
      (type === 'status_change' && preferences.notify_status_change) ||
      (type === 'new_comment' && preferences.notify_new_comment) ||
      (type === 'assignment' && preferences.notify_assignment) ||
      (type === 'sla_warning' && preferences.notify_sla_warning);

    if (!shouldSend) {
      console.log("User has disabled this notification type");
      return new Response(
        JSON.stringify({ success: false, reason: "User preferences" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Get user email
    const { data: profile } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("user_id", to)
      .single();

    if (!profile?.email) {
      throw new Error("User email not found");
    }

    // Build email HTML
    const complaintLink = complaintId 
      ? `${Deno.env.get("SITE_URL") || "http://localhost:5173"}/dashboard/complaints/${complaintId}`
      : "";

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
              background-color: #0a0a0a;
              color: #ffffff;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 40px 20px;
            }
            .header {
              background: linear-gradient(135deg, #8B5CF6, #EC4899);
              padding: 30px;
              border-radius: 12px 12px 0 0;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              color: #ffffff;
            }
            .content {
              background: rgba(255, 255, 255, 0.05);
              backdrop-filter: blur(10px);
              border: 1px solid rgba(255, 255, 255, 0.1);
              padding: 30px;
              border-radius: 0 0 12px 12px;
            }
            .ticket-number {
              display: inline-block;
              background: rgba(139, 92, 246, 0.2);
              color: #A78BFA;
              padding: 8px 16px;
              border-radius: 6px;
              font-family: 'Courier New', monospace;
              margin-bottom: 20px;
            }
            .message {
              font-size: 16px;
              line-height: 1.6;
              margin: 20px 0;
              color: #e0e0e0;
            }
            .button {
              display: inline-block;
              background: linear-gradient(135deg, #8B5CF6, #EC4899);
              color: #ffffff;
              text-decoration: none;
              padding: 14px 32px;
              border-radius: 8px;
              font-weight: 600;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              padding: 20px;
              color: #888;
              font-size: 14px;
            }
            .footer a {
              color: #8B5CF6;
              text-decoration: none;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🛡️ Brototype Complaint System</h1>
            </div>
            <div class="content">
              <p>Hi ${profile.full_name},</p>
              ${ticketNumber ? `<div class="ticket-number">Ticket: ${ticketNumber}</div>` : ''}
              <div class="message">${message}</div>
              ${complaintLink ? `
                <a href="${complaintLink}" class="button">View Complaint</a>
              ` : ''}
              <p style="margin-top: 30px; color: #888; font-size: 14px;">
                This is an automated notification from the Brototype Complaint Management System.
              </p>
            </div>
            <div class="footer">
              <p>
                Don't want these emails? 
                <a href="${Deno.env.get("SITE_URL") || "http://localhost:5173"}/dashboard/settings">
                  Update your preferences
                </a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "Brototype <onboarding@resend.dev>",
      to: [profile.email],
      subject: subject,
      html: html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, data: emailResponse }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
