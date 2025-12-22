// GitHub API Proxy - Handles authenticated GitHub API requests
// This allows fetching from private repositories using a GitHub token

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  
  // Get GitHub token from environment variables
  const GITHUB_TOKEN = env.GITHUB_TOKEN;
  
  if (!GITHUB_TOKEN) {
    return new Response(JSON.stringify({ 
      error: 'GitHub token not configured' 
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
  }

  try {
    // Parse the request
    const requestData = await request.json();
    const { endpoint, owner, repo, path, branch = 'main' } = requestData;

    let githubUrl;
    let headers = {
      'Authorization': `Bearer ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Trizly-Portfolio-System'
    };

    // Determine which GitHub endpoint to call
    switch (endpoint) {
      case 'repos':
        // List all repos for the organization/user
        githubUrl = `https://api.github.com/users/${owner}/repos?per_page=100&sort=updated`;
        break;

      case 'repo':
        // Get specific repo details
        githubUrl = `https://api.github.com/repos/${owner}/${repo}`;
        break;

      case 'content':
        // Get file content from repo
        githubUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
        break;

      case 'raw':
        // Get raw file content
        githubUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
        // For raw content, we need a different auth header
        headers = {
          'Authorization': `token ${GITHUB_TOKEN}`,
        };
        break;

      case 'tree':
        // Get repository tree (for browsing repo structure)
        githubUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;
        break;

      default:
        return new Response(JSON.stringify({ 
          error: 'Invalid endpoint specified' 
        }), {
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
    }

    // Make the request to GitHub
    const githubResponse = await fetch(githubUrl, {
      headers: headers
    });

    // Get the response data
    const contentType = githubResponse.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await githubResponse.json();
    } else {
      data = await githubResponse.text();
    }

    // Check for errors
    if (!githubResponse.ok) {
      console.error('GitHub API error:', data);
      return new Response(JSON.stringify({ 
        error: 'GitHub API request failed',
        status: githubResponse.status,
        message: data.message || 'Unknown error'
      }), {
        status: githubResponse.status,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Return the data
    return new Response(typeof data === 'string' ? data : JSON.stringify(data), {
      status: 200,
      headers: { 
        'Content-Type': contentType || 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
      }
    });

  } catch (error) {
    console.error('Error in GitHub proxy:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error.message 
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}
