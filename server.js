// server.js
require('dotenv').config();
const express = require('express');
const { fetchLanguageUsage } = require('./fetcher');
const { renderChart } = require('./renderer');

const app = express();
const PORT = process.env.PORT || 3000;

/**
 * GET /chart
 * Query params:
 *  - username (e.g. ?username=the-shy-dev)
 *  - layout   (e.g. ?layout=donut | donut-vertical | pie | hidden | compact)
 *  - theme    (e.g. ?theme=dark)
 *
 * Examples:
 *  /chart?username=the-shy-dev
 *  /chart?username=the-shy-dev&layout=donut
 *  /chart?username=the-shy-dev&layout=donut-vertical&theme=dark
 */
app.get('/chart', async (req, res) => {
    const username = req.query.username || 'the-shy-dev';
    const layout = req.query.layout || 'compact';
    const theme = req.query.theme === 'dark' ? 'dark' : 'light';

    try {
        const usage = await fetchLanguageUsage(username);
        const svg = renderChart(usage, layout, theme);
        res.setHeader('Content-Type', 'image/svg+xml');
        res.send(svg);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error generating chart');
    }
});

// At the end of server.js
module.exports = app;
// Optionally, if running locally, you can still call app.listen when not in a Vercel environment:
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}
