// fetcher.js
require('dotenv').config();
const axios = require('axios');

const GITHUB_GRAPHQL_API_URL = 'https://api.github.com/graphql';

// Query to fetch repositories and their languages (paginated)
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

// Query to fetch the contributions calendar (for activity streak)
const CONTRIBUTIONS_QUERY = `
  query($login: String!) {
    user(login: $login) {
      contributionsCollection {
        contributionCalendar {
          weeks {
            contributionDays {
              date
              contributionCount
            }
          }
        }
      }
    }
  }
`;

/**
 * Fetch languages from repositories using GraphQL.
 * Aggregates language sizes from all pages.
 */
async function fetchLanguages(username) {
    const token = process.env.GITHUB_TOKEN;
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }
    let totalLangs = {};
    let hasNextPage = true;
    let afterCursor = null;

    while (hasNextPage) {
        const response = await axios.post(
            GITHUB_GRAPHQL_API_URL,
            {
                query: REPOS_LANGUAGES_QUERY,
                variables: { login: username, after: afterCursor },
            },
            { headers }
        );
        const data = response.data;
        if (data.errors) {
            throw new Error(`GraphQL error: ${data.errors.map(e => e.message).join(', ')}`);
        }
        const user = data.data.user;
        if (!user) {
            throw new Error(`User "${username}" not found.`);
        }
        const repos = user.repositories.nodes;
        const pageInfo = user.repositories.pageInfo;
        hasNextPage = pageInfo.hasNextPage;
        afterCursor = pageInfo.endCursor;
        for (const repo of repos) {
            if (repo.languages && repo.languages.edges) {
                for (const edge of repo.languages.edges) {
                    const langName = edge.node.name;
                    const size = edge.size;
                    totalLangs[langName] = (totalLangs[langName] || 0) + size;
                }
            }
        }
    }
    return totalLangs;
}

/**
 * Compute the current activity streak from contribution calendar data.
 * We flatten the weeks into a list of days, sort descending by date,
 * and then count consecutive days with at least one contribution.
 */
function computeCurrentStreak(weeks) {
    let days = [];
    for (const week of weeks) {
        days = days.concat(week.contributionDays);
    }
    // Sort by date descending (most recent first)
    days.sort((a, b) => new Date(b.date) - new Date(a.date));

    let streak = 0;
    let prevDate = null;
    for (const day of days) {
        if (day.contributionCount > 0) {
            const currentDate = new Date(day.date);
            if (!prevDate) {
                // First day in the list – if it’s today or very recent, start the streak
                streak++;
                prevDate = currentDate;
            } else {
                // Calculate the difference in days between previous and current date
                const diff = (prevDate - currentDate) / (1000 * 3600 * 24);
                if (diff >= 1 && diff < 2) {
                    streak++;
                    prevDate = currentDate;
                } else {
                    break;
                }
            }
        } else {
            break;
        }
    }
    return streak;
}

/**
 * Fetch contributions data and compute the activity streak.
 */
async function fetchContributions(username) {
    const token = process.env.GITHUB_TOKEN;
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }
    const response = await axios.post(
        GITHUB_GRAPHQL_API_URL,
        {
            query: CONTRIBUTIONS_QUERY,
            variables: { login: username },
        },
        { headers }
    );
    const data = response.data;
    if (data.errors) {
        throw new Error(`GraphQL error: ${data.errors.map(e => e.message).join(', ')}`);
    }
    const user = data.data.user;
    if (!user) {
        throw new Error(`User "${username}" not found.`);
    }
    const weeks = user.contributionsCollection.contributionCalendar.weeks;
    return computeCurrentStreak(weeks);
}

/**
 * Fetch user data: languages usage and activity streak.
 */
async function fetchUserData(username) {
    const languages = await fetchLanguages(username);
    let streak = 0;
    try {
        streak = await fetchContributions(username);
    } catch (e) {
        console.warn('Could not fetch contributions streak:', e.message);
    }
    return { languages, streak };
}

module.exports = {
    fetchUserData
};
