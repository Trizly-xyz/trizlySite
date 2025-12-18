# GitHub Token Setup for Private Repositories

## Overview
The portfolio system now supports private GitHub repositories using authenticated API requests through Cloudflare Pages Functions.

## Setup Instructions

### 1. Create a GitHub Personal Access Token

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Or visit: https://github.com/settings/tokens

2. Click "Generate new token" → "Generate new token (classic)"

3. Configure the token:
   - **Name**: `Trizly Portfolio System`
   - **Expiration**: Choose appropriate expiration (90 days, 1 year, or no expiration)
   - **Scopes**: Select the following permissions:
     - ✅ `repo` (Full control of private repositories)
       - This includes: `repo:status`, `repo_deployment`, `public_repo`, `repo:invite`, `security_events`

4. Click "Generate token" and **copy the token immediately** (you won't be able to see it again)

### 2. Add Token to Cloudflare Pages

#### Via Cloudflare Dashboard:

1. Go to your Cloudflare Dashboard
2. Navigate to **Workers & Pages**
3. Select your **trizlySite** project
4. Go to **Settings** → **Environment variables**
5. Click **Add variables**
6. Add the following:
   - **Variable name**: `GITHUB_TOKEN`
   - **Value**: Paste your GitHub token
   - **Type**: Make sure it's set to "Encrypted" (lock icon)
   - **Environment**: Select "Production" (and "Preview" if you want it in preview deployments too)
7. Click **Save**

#### Via Wrangler CLI (alternative):

```bash
# Set the environment variable
wrangler pages project env set GITHUB_TOKEN <your-token-here>

# Verify it was set
wrangler pages project env list
```

### 3. Redeploy Your Site

After adding the environment variable, you need to trigger a new deployment:

```bash
git add .
git commit -m "Add private repo support via GitHub token"
git push
```

Or manually trigger a deployment in the Cloudflare Dashboard.

## How It Works

### Architecture

```
Browser → Cloudflare Pages → GitHub API (authenticated)
          (Client)            (Proxy Function)
```

1. **Client-side code** (`github-manager.js`) makes requests to `/api/github`
2. **Cloudflare Function** (`/functions/api/github.js`) receives the request
3. Function adds GitHub token from environment variable
4. Authenticates with GitHub API and fetches data
5. Returns data to client

### Security Benefits

- ✅ GitHub token never exposed to the browser
- ✅ Token stored securely in Cloudflare environment variables
- ✅ Can access private repositories
- ✅ CORS-safe requests
- ✅ Rate limits applied per token (not per IP)

## Supported Features

### Repository Access
- ✅ Public repositories
- ✅ Private repositories (with token)
- ✅ Organization repositories
- ✅ User repositories

### API Endpoints
The Cloudflare function supports these GitHub API endpoints:

- `repos` - List all repositories
- `repo` - Get specific repository details
- `content` - Get file content (API format)
- `raw` - Get raw file content
- `tree` - Get repository file tree

### Usage Example

```javascript
// Fetch all repos (public + private)
const repos = await githubRequest('repos');

// Get README from a repo
const readme = await githubRequest('raw', {
  repo: 'portfolioMyProject',
  path: 'README.md',
  branch: 'main'
});

// Get repo tree structure
const tree = await githubRequest('tree', {
  repo: 'portfolioMyProject',
  branch: 'main'
});
```

## Troubleshooting

### Token Not Working
- Verify the token has `repo` scope enabled
- Check that the token hasn't expired
- Ensure the variable name is exactly `GITHUB_TOKEN`
- Redeploy the site after adding the token

### Private Repos Not Showing
- Confirm the token has access to the organization/repos
- Check browser console for API errors
- Verify the repo name matches the `portfolio*` pattern

### Rate Limiting
- GitHub authenticated requests have a limit of 5,000/hour
- Unauthenticated: 60/hour
- The system caches responses for 5 minutes to reduce API calls

## Token Permissions Reference

### Minimum Required Scopes:
- `repo` - Required for private repository access

### Optional But Recommended:
- `read:org` - If you want to list organization repositories
- `read:user` - For user information

## Rotating Tokens

To rotate your token:

1. Generate a new token with the same scopes
2. Update the `GITHUB_TOKEN` in Cloudflare
3. Delete the old token from GitHub
4. Redeploy the site

## Testing

After setup, test by:

1. Creating a private repo named `portfolioTest`
2. Add a README.md to it
3. Visit your portfolio page
4. The private repo should appear automatically

## Environment Variable Reference

Required environment variables:

```bash
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VIEW_API=<your-view-api-endpoint>  # Already configured
```
