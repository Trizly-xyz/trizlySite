// Portfolio Configuration
const PORTFOLIO_CONFIG = {
  githubOwner: 'Trizly-xyz',
  
  repoPattern: /^portfolio(.+)$/i,
  
  // Static portfolios (existing ones that aren't GitHub-based)
  staticPortfolios: [
    {
      name: 'Bloxy',
      slug: 'bloxy',
      path: '/portfolio/bloxy/',
      description: 'Roblox community management bot',
      featured: true
    },
    {
      name: 'Mason',
      slug: 'mason',
      path: '/portfolio/mason/',
      description: 'Advanced Discord bot',
      featured: true
    },
    {
      name: 'Trizl',
      slug: 'trizl',
      path: '/portfolio/trizl/',
      description: 'Next-gen community tools',
      featured: true
    }
  ],
  
  // Cache duration for GitHub API calls (in milliseconds)
  cacheDuration: 5 * 60 * 1000, // 5 minutes
  
  // Expected structure in portfolio repositories
  expectedFiles: {
    readme: 'README.md',
    config: 'portfolio.json', // Optional config file in repo
    thumbnail: 'thumbnail.png' // Optional thumbnail
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PORTFOLIO_CONFIG;
}
