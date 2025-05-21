// server.js
require('dotenv').config();
const express = require('express');
const { fetchUserData } = require('./fetcher');
const { renderChart } = require('./renderer');

const app = express();
const PORT = process.env.PORT || 3000;

// Rename endpoint from /chart to /summary.
app.get('/summary', async (req, res) => {
    const username = req.query.username || 'the-shy-dev';
    const layout = req.query.layout || 'compact';
    const theme = req.query.theme || 'light';
    const max_items = req.query.max_items || 6;
    try {
        // Fetch both language usage and activity streak
        const { languages, streak } = await fetchUserData(username);
        const svg = renderChart(languages, layout, theme, streak, max_items);
        res.setHeader('Content-Type', 'image/svg+xml');
        res.send(svg);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error generating summary');
    }
});

// For local testing
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

module.exports = app;
