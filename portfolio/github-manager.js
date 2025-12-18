// GitHub Portfolio Manager
// Fetches and manages dynamic portfolios from GitHub repositories

class GitHubPortfolioManager {
  constructor(config) {
    this.config = config;
    this.cache = {
      data: null,
      timestamp: null
    };
    this.apiEndpoint = '/api/github';
  }

  /**
   * Make an authenticated request to GitHub via Cloudflare Function
   */
  async githubRequest(endpoint, params = {}) {
    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          endpoint,
          owner: this.config.githubOwner,
          ...params
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `API error: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        return await response.text();
      }
    } catch (error) {
      console.error('Error making GitHub request:', error);
      throw error;
    }
  }

  /**
   * Fetch all repositories from the GitHub organization
   */
  async fetchRepositories() {
    try {
      const repos = await this.githubRequest('repos');
      return Array.isArray(repos) ? repos : [];
    } catch (error) {
      console.error('Error fetching repositories:', error);
      return [];
    }
  }

  /**
   * Filter repositories that match the portfolio pattern
   */
  filterPortfolioRepos(repos) {
    return repos.filter(repo => {
      const match = repo.name.match(this.config.repoPattern);
      return match !== null;
    });
  }

  /**
   * Extract portfolio name from repository name
   * Example: "portfolioBloxy" -> "Bloxy"
   */
  extractPortfolioName(repoName) {
    const match = repoName.match(this.config.repoPattern);
    if (match && match[1]) {
      // Capitalize first letter
      return match[1].charAt(0).toUpperCase() + match[1].slice(1);
    }
    return repoName;
  }

  /**
   * Fetch portfolio configuration from repository
   */
  async fetchPortfolioConfig(repo) {
    try {
      const data = await this.githubRequest('raw', {
        repo: repo.name,
        path: this.config.expectedFiles.config,
        branch: repo.default_branch || 'main'
      });

      // If data is a string, parse it as JSON
      if (typeof data === 'string') {
        return JSON.parse(data);
      }
      return data;
    } catch (error) {
      console.log(`No config found for ${repo.name}, using defaults`);
      return null;
    }
  }

  /**
   * Fetch README content from repository
   */
  async fetchReadme(repo) {
    try {
      const data = await this.githubRequest('raw', {
        repo: repo.name,
        path: this.config.expectedFiles.readme,
        branch: repo.default_branch || 'main'
      });

      return data;
    } catch (error) {
      console.error(`Error fetching README for ${repo.name}:`, error);
      return null;
    }
  }

  /**
   * Fetch entire repository tree structure
   */
  async fetchRepoTree(repo) {
    try {
      const tree = await this.githubRequest('tree', {
        repo: repo.name,
        branch: repo.default_branch || 'main'
      });

      return tree;
    } catch (error) {
      console.error(`Error fetching tree for ${repo.name}:`, error);
      return null;
    }
  }

  /**
   * Fetch specific file content from repository
   */
  async fetchFileContent(repoName, filePath, branch = 'main') {
    try {
      const data = await this.githubRequest('raw', {
        repo: repoName,
        path: filePath,
        branch: branch
      });

      return data;
    } catch (error) {
      console.error(`Error fetching file ${filePath} from ${repoName}:`, error);
      return null;
    }
  }

  /**
   * Transform repository data into portfolio format
   */
  async transformToPortfolio(repo) {
    const portfolioName = this.extractPortfolioName(repo.name);
    const config = await this.fetchPortfolioConfig(repo);
    
    return {
      name: config?.name || portfolioName,
      slug: repo.name.toLowerCase(),
      description: config?.description || repo.description || 'No description available',
      repoUrl: repo.html_url,
      homepage: repo.homepage,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      updatedAt: repo.updated_at,
      language: repo.language,
      topics: repo.topics || [],
      defaultBranch: repo.default_branch || 'main',
      thumbnail: config?.thumbnail || `https://raw.githubusercontent.com/${this.config.githubOwner}/${repo.name}/${repo.default_branch || 'main'}/${this.config.expectedFiles.thumbnail}`,
      isDynamic: true,
      featured: config?.featured || false,
      isPrivate: repo.private || false
    };
  }

  /**
   * Get all portfolios (static + dynamic)
   */
  async getAllPortfolios() {
    // Check cache
    const now = Date.now();
    if (this.cache.data && this.cache.timestamp && (now - this.cache.timestamp < this.config.cacheDuration)) {
      console.log('Using cached portfolio data');
      return this.cache.data;
    }

    // Fetch fresh data
    console.log('Fetching fresh portfolio data from GitHub...');
    const repos = await this.fetchRepositories();
    const portfolioRepos = this.filterPortfolioRepos(repos);
    
    // Transform dynamic portfolios
    const dynamicPortfolios = await Promise.all(
      portfolioRepos.map(repo => this.transformToPortfolio(repo))
    );

    // Combine with static portfolios
    const allPortfolios = [
      ...this.config.staticPortfolios,
      ...dynamicPortfolios
    ];

    // Sort by featured first, then by name
    allPortfolios.sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return a.name.localeCompare(b.name);
    });

    // Update cache
    this.cache = {
      data: allPortfolios,
      timestamp: now
    };

    return allPortfolios;
  }

  /**
   * Get a specific portfolio by slug
   */
  async getPortfolio(slug) {
    const portfolios = await this.getAllPortfolios();
    return portfolios.find(p => p.slug === slug);
  }

  /**
   * Get repository content for a dynamic portfolio
   */
  async getPortfolioContent(slug) {
    const portfolio = await this.getPortfolio(slug);
    
    if (!portfolio || !portfolio.isDynamic) {
      return null;
    }

    // Fetch README and repository tree
    const [readme, tree] = await Promise.all([
      this.fetchReadme({ name: slug, default_branch: portfolio.defaultBranch }),
      this.fetchRepoTree({ name: slug, default_branch: portfolio.defaultBranch })
    ]);
    
    return {
      ...portfolio,
      readme,
      tree
    };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GitHubPortfolioManager;
}
