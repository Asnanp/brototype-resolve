import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ComplaintData {
  title: string;
  description: string;
  category_id?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  email: string;
  full_name: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const data: ComplaintData = await req.json();
    
    console.log('Received complaint submission:', data);

    // Validate required fields
    if (!data.title || !data.description || !data.email || !data.full_name) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user exists by email
    const { data: existingProfile } = await supabaseClient
      .from('profiles')
      .select('user_id')
      .eq('email', data.email)
      .single();

    let userId: string;

    if (existingProfile) {
      userId = existingProfile.user_id;
    } else {
      // Create anonymous user account
      const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser({
        email: data.email,
        email_confirm: true,
        user_metadata: {
          full_name: data.full_name,
          role: 'student'
        }
      });

      if (authError) {
        console.error('Error creating user:', authError);
        return new Response(
          JSON.stringify({ error: 'Failed to create user account' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      userId = authData.user.id;
    }

    // Create the complaint
    const { data: complaint, error: complaintError } = await supabaseClient
      .from('complaints')
      .insert({
        title: data.title,
        description: data.description,
        category_id: data.category_id || null,
        priority: data.priority || 'medium',
        student_id: userId,
        status: 'open'
      })
      .select()
      .single();

    if (complaintError) {
      console.error('Error creating complaint:', complaintError);
      return new Response(
        JSON.stringify({ error: 'Failed to create complaint' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Complaint created successfully:', complaint);

    return new Response(
      JSON.stringify({ 
        success: true, 
        ticket_number: complaint.ticket_number,
        message: 'Complaint submitted successfully'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in submit-complaint-widget:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});