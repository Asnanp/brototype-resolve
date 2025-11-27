import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

serve(async (req: Request) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Running SLA monitor...");

    // Update SLA statuses
    await supabase.rpc("update_sla_status");

    // Get complaints at risk or breached
    const { data: atRiskComplaints, error } = await supabase
      .from("complaints")
      .select(`
        id,
        ticket_number,
        title,
        sla_breach_at,
        sla_status,
        student_id,
        assigned_to,
        profiles!complaints_student_id_fkey(full_name, email)
      `)
      .in("sla_status", ["at_risk", "breached"])
      .not("status", "in", '("resolved","closed")');

    if (error) {
      console.error("Error fetching at-risk complaints:", error);
      throw error;
    }

    console.log(`Found ${atRiskComplaints?.length || 0} complaints needing attention`);

    // Send notifications for at-risk complaints
    if (atRiskComplaints && atRiskComplaints.length > 0) {
      for (const complaint of atRiskComplaints) {
        // Notify student
        try {
          await supabase.functions.invoke("send-notification-email", {
            body: {
              to: complaint.student_id,
              subject: `SLA ${complaint.sla_status === 'breached' ? 'Breached' : 'Alert'}: ${complaint.ticket_number}`,
              message: `Your complaint "${complaint.title}" ${
                complaint.sla_status === 'breached'
                  ? 'has breached its SLA deadline'
                  : 'is at risk of breaching its SLA deadline'
              }. We are working to resolve it as soon as possible.`,
              complaintId: complaint.id,
              ticketNumber: complaint.ticket_number,
              type: 'sla_warning',
            },
          });
        } catch (emailError) {
          console.error(`Failed to send email for complaint ${complaint.id}:`, emailError);
        }

        // Notify assigned admin
        if (complaint.assigned_to) {
          try {
            await supabase.functions.invoke("send-notification-email", {
              body: {
                to: complaint.assigned_to,
                subject: `SLA ${complaint.sla_status === 'breached' ? 'Breach' : 'Warning'}: ${complaint.ticket_number}`,
                message: `Complaint "${complaint.title}" ${
                  complaint.sla_status === 'breached'
                    ? 'has breached its SLA deadline'
                    : 'is approaching its SLA deadline'
                }. Please take action immediately.`,
                complaintId: complaint.id,
                ticketNumber: complaint.ticket_number,
                type: 'sla_warning',
              },
            });
          } catch (emailError) {
            console.error(`Failed to send admin email for complaint ${complaint.id}:`, emailError);
          }
        }
      }
    }

    console.log("SLA monitor completed successfully");

    return new Response(
      JSON.stringify({
        success: true,
        processed: atRiskComplaints?.length || 0,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in SLA monitor:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
