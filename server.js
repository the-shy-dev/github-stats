// server.js
require('dotenv').config();
const express = require('express');
const { fetchLanguageUsage } = require('./fetcher'); // our new GraphQL fetcher
const { renderChart } = require('./renderer');       // your existing renderer

const app = express();
const PORT = process.env.PORT || 3000;

/**
 * /chart endpoint
 * Query params:
 *   - username (e.g. ?username=the-shy-dev)
 *   - layout   (e.g. ?layout=donut | donut-vertical | pie | hidden | compact)
 *   - theme    (e.g. ?theme=dark)
 */
app.get('/chart', async (req, res) => {
    const username = req.query.username || 'the-shy-dev';
    const layout = req.query.layout || 'compact';
    const theme = req.query.theme === 'dark' ? 'dark' : 'light';

    try {
        // 1) Fetch language usage via GraphQL
        const usage = await fetchLanguageUsage(username);

        // 2) Render the chosen layout as SVG
        const svg = renderChart(usage, layout, theme);

        res.setHeader('Content-Type', 'image/svg+xml');
        res.send(svg);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error generating chart');
    }
});

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

module.exports = app; // for vercel or other serverless
