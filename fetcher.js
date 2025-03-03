// fetcher.js
require('dotenv').config();
const axios = require('axios');

/**
 * Fetch aggregated language usage for a given GitHub user.
 * - Uses public-only data if no GITHUB_TOKEN is present.
 * - Includes private repos if GITHUB_TOKEN is present (with 'repo' scope).
 */
async function fetchLanguageUsage(username) {
    const headers = {};
    if (process.env.GITHUB_TOKEN) {
        headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    // Fetch up to 100 repos (add pagination if you have more).
    const reposRes = await axios.get(
        `https://api.github.com/users/${username}/repos?per_page=100`,
        { headers }
    );

    const totalLangs = {};
    for (const repo of reposRes.data) {
        try {
            const { data: languages } = await axios.get(repo.languages_url, { headers });
            for (const [lang, bytes] of Object.entries(languages)) {
                totalLangs[lang] = (totalLangs[lang] || 0) + bytes;
            }
        } catch (err) {
            console.error(`Error fetching languages for repo ${repo.name}: ${err.message}`);
        }
    }

    return totalLangs;
}

module.exports = { fetchLanguageUsage };
