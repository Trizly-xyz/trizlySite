export async function onRequestPost(context) {
  try {
    const { visitorId } = await context.request.json();
    
    // Get the actual API endpoint from environment variables
    const VIEW_API = context.env.VIEW_API;
    
    if (!VIEW_API) {
      return new Response(JSON.stringify({ error: 'API not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Proxy the request to your actual API
    const response = await fetch(VIEW_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visitorId })
    });
    
    const data = await response.json();
    
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch views' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
