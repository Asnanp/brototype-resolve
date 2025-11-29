import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Fetch training data from database
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    const { data: trainingData } = await supabase
      .from('ai_training_data')
      .select('question, answer, category, keywords')
      .eq('is_active', true)
      .limit(50);

    // Build context from training data
    let trainingContext = '';
    if (trainingData && trainingData.length > 0) {
      trainingContext = '\n\nYou have access to the following verified Q&A knowledge base:\n\n';
      trainingData.forEach((item, index) => {
        trainingContext += `${index + 1}. Q: ${item.question}\n   A: ${item.answer}\n`;
        if (item.category) trainingContext += `   Category: ${item.category}\n`;
        if (item.keywords) trainingContext += `   Keywords: ${item.keywords.join(', ')}\n`;
        trainingContext += '\n';
      });
      trainingContext += '\nUse this knowledge base to answer relevant questions accurately. If the question matches something in the knowledge base, provide that answer with appropriate context.';
    }

    const systemPrompt = `You are a helpful AI assistant for Brototype educational institution's complaint management system.
Your role is to help students with:
- Understanding how to file complaints effectively
- Explaining complaint processes and timelines
- Providing guidance on what information to include
- Answering general questions about the complaint system
- Offering support and empathy for student concerns
- Suggesting which category or priority level to use
- Explaining SLA policies and response times
${trainingContext}

Always be professional, empathetic, and supportive. Keep responses concise and actionable.
If asked about specific complaints, guide students to check their complaint details page.
Never make promises about resolution times or outcomes - only explain the process.
When using information from the knowledge base, be natural and conversational.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded, please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Service temporarily unavailable.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });
  } catch (error) {
    console.error('Error in student-ai-assistant-enhanced:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
