/**
 * ShadowTalk AI — Web Search Edge Function
 * 
 * Performs web searches using SerpAPI or Tavily.
 * Returns search results for the chat agent.
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
    const { query, num_results = 5 } = await req.json();

    const SERP_API_KEY = Deno.env.get('SERP_API_KEY');
    const TAVILY_API_KEY = Deno.env.get('TAVILY_API_KEY');

    if (!SERP_API_KEY && !TAVILY_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'No search API configured. Set SERP_API_KEY or TAVILY_API_KEY.' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let results: any[] = [];

    if (TAVILY_API_KEY) {
      const resp = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: TAVILY_API_KEY,
          query,
          max_results: num_results,
          include_answer: true,
        }),
      });
      const data = await resp.json();
      results = (data.results || []).map((r: any) => ({
        title: r.title,
        url: r.url,
        snippet: r.content,
        score: r.score,
      }));
      if (data.answer) {
        results.unshift({ title: 'AI Answer', url: '', snippet: data.answer, score: 1 });
      }
    } else {
      const params = new URLSearchParams({
        q: query,
        api_key: SERP_API_KEY!,
        num: String(num_results),
      });
      const resp = await fetch(`https://serpapi.com/search?${params}`);
      const data = await resp.json();
      results = (data.organic_results || []).map((r: any) => ({
        title: r.title,
        url: r.link,
        snippet: r.snippet,
      }));
    }

    return new Response(
      JSON.stringify({ results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Web search error:', err);
    return new Response(
      JSON.stringify({ error: 'Search failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
