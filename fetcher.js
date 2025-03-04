// fetcher.js
require('dotenv').config();
const axios = require('axios');

const GITHUB_GRAPHQL_API_URL = 'https://api.github.com/graphql';

/**
 * Query template for fetching up to 100 repos + their languages.
 * We'll use variables: $login, $after for pagination.
 */
const REPOS_LANGUAGES_QUERY = `
  query($login: String!, $after: String) {
    user(login: $login) {
      repositories(first: 100, after: $after, ownerAffiliations: [OWNER, COLLABORATOR], isFork: false) {
        pageInfo {
          endCursor
          hasNextPage
        }
        nodes {
          languages(first: 10, orderBy: { field: SIZE, direction: DESC }) {
            edges {
              size
              node {
                name
              }
            }
          }
        }
      }
    }
  }
`;

/**
 * Fetch all repositories (in pages of 100) and sum up the language usage.
 * - If GITHUB_TOKEN has 'repo' scope, includes private repos.
 * - If not set, only public repos are returned.
 */
async function fetchLanguageUsage(username) {
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
        console.warn('No GITHUB_TOKEN provided. Only public repos will be fetched, and rate limits may apply.');
    }

    // We'll accumulate language usage in totalLangs = { "JavaScript": 12345, "CSS": 6789, ... }
    const totalLangs = {};
    let hasNextPage = true;
    let afterCursor = null;

    while (hasNextPage) {
        // 1) Make a single GraphQL request for the next page of repos
        const { data } = await axios.post(
            GITHUB_GRAPHQL_API_URL,
            {
                query: REPOS_LANGUAGES_QUERY,
                variables: { login: username, after: afterCursor },
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`, // if token is undefined, request is still made but for public data only
                },
            }
        );

        // 2) Check for errors
        if (data.errors) {
            console.error('GraphQL errors:', data.errors);
            throw new Error('Error from GitHub GraphQL API');
        }

        const userData = data.data.user;
        if (!userData) {
            throw new Error(`User "${username}" not found or no access.`);
        }

        const repos = userData.repositories.nodes;
        const pageInfo = userData.repositories.pageInfo;
        hasNextPage = pageInfo.hasNextPage;
        afterCursor = pageInfo.endCursor;

        // 3) Aggregate language usage from each repo
        for (const repo of repos) {
            if (!repo.languages) continue;
            for (const edge of repo.languages.edges) {
                const langName = edge.node.name;
                const size = edge.size;
                totalLangs[langName] = (totalLangs[langName] || 0) + size;
            }
        }
    }

    return totalLangs;
}

module.exports = { fetchLanguageUsage };
