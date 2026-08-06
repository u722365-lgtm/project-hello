/**
 * ShadowTalk AI — Shadow Agent Tools Edge Function
 * 
 * Multiplexes tool calls for the autonomous agent system.
 * Routes to the appropriate sub-handler based on tool name.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { tool, params } = await req.json();

    switch (tool) {
      case 'web_search': {
        // Forward to web-search function
        const searchResp = await fetch(
          `${Deno.env.get('SUPABASE_URL')}/functions/v1/web-search`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: req.headers.get('Authorization')! },
            body: JSON.stringify(params),
          }
        );
        return new Response(searchResp.body, { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'firecrawl_scrape': {
        const scrapeResp = await fetch(
          `${Deno.env.get('SUPABASE_URL')}/functions/v1/firecrawl-scrape`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: req.headers.get('Authorization')! },
            body: JSON.stringify(params),
          }
        );
        return new Response(scrapeResp.body, { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      default:
        return new Response(
          JSON.stringify({ error: `Unknown tool: ${tool}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (err) {
    console.error('Agent tools error:', err);
    return new Response(
      JSON.stringify({ error: 'Tool execution failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
