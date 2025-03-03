// renderer.js

// Expanded language color map
const languageColors = {
    JavaScript: '#f1e05a',
    TypeScript: '#2b7489',
    HTML: '#e34c26',
    CSS: '#563d7c',
    SCSS: '#c6538c',
    Python: '#3572A5',
    Java: '#b07219',
    C: '#555555',
    'C++': '#f34b7d',
    'C#': '#178600',
    Go: '#00ADD8',
    PHP: '#4F5D95',
    Ruby: '#701516',
    Swift: '#ffac45',
    Kotlin: '#A97BFF',
    Dart: '#00B4AB',
    Rust: '#dea584',
    R: '#198CE7',
    Scala: '#c22d40',
    Shell: '#89e051',
    ObjectiveC: '#438eff', // If "Objective-C" -> rename key to match actual language name from GH
    Perl: '#0298c3',
    Lua: '#000080',
    Haskell: '#5e5086',
    Elixir: '#4e2a8e',
    Clojure: '#db5855',
    Groovy: '#4298b8',
    CoffeeScript: '#244776',
    Erlang: '#B83998',
    OCaml: '#3be133',
    PowerShell: '#012456',
    Vimscript: '#199f4b',
    Makefile: '#427819',
    // ... add or adjust as needed
};

// 1) Convert degrees to radians
function deg2rad(deg) {
    return (deg * Math.PI) / 180;
}

// 2) Sort language usage + map to array
function prepareLangData(langs) {
    const total = Object.values(langs).reduce((a, b) => a + b, 0);
    if (total === 0) return [];

    return Object.entries(langs)
        .sort((a, b) => b[1] - a[1]) // descending
        .map(([lang, bytes]) => {
            const fraction = bytes / total;
            return {
                lang,
                bytes,
                fraction,
                percentage: (fraction * 100).toFixed(1),
                color: languageColors[lang] || '#cccccc',
            };
        });
}

// 3) Arc path for donut/pie segments
function arcPath(cx, cy, r, startAngle, endAngle) {
    const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;
    const startX = cx + r * Math.cos(deg2rad(startAngle));
    const startY = cy + r * Math.sin(deg2rad(startAngle));
    const endX = cx + r * Math.cos(deg2rad(endAngle));
    const endY = cy + r * Math.sin(deg2rad(endAngle));

    return [
        `M ${startX} ${startY}`,
        `A ${r} ${r} 0 ${largeArcFlag} 1 ${endX} ${endY}`,
    ].join(' ');
}

// 4) Helper: if no language data, show placeholder
function noLangDataContent(width, height, textColor) {
    return `
      <text x="${width / 2}" y="${height / 2}" fill="${textColor}" font-size="16"
        text-anchor="middle" alignment-baseline="middle">
        No languages found
      </text>
    `;
}

// 5) Master function to wrap chart content in a responsive SVG
function createResponsiveSVG({ width, height, background, children }) {
    return `
      <svg
        viewBox="0 0 ${width} ${height}"
        style="max-width: 100%; height: auto;"
        preserveAspectRatio="xMidYMid meet"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="100%" height="100%" fill="${background}" />
        ${children}
      </svg>
    `;
}

/* ------------------------------------------------------------------
   LAYOUT RENDERERS
   ------------------------------------------------------------------ */

/** Layout 1) Compact bars */
function renderCompactChart(langData, theme) {
    const width = 400;
    const height = 220;
    const background = theme === 'dark' ? '#0d1117' : '#ffffff';
    const textColor = theme === 'dark' ? '#c9d1d9' : '#333333';

    if (langData.length === 0) {
        return createResponsiveSVG({
            width,
            height,
            background,
            children: noLangDataContent(width, height, textColor),
        });
    }

    const maxBarWidth = 200;
    const maxBytes = Math.max(...langData.map(d => d.bytes));

    let bars = `
      <text x="20" y="30" fill="${textColor}" font-size="18" font-family="sans-serif">
        Most Used Languages
      </text>
    `;

    let offsetY = 60;
    for (const d of langData) {
        const barWidth = (d.bytes / maxBytes) * maxBarWidth;
        bars += `
        <text x="20" y="${offsetY + 12}" fill="${textColor}" font-size="14" font-family="sans-serif">
          ${d.lang} (${d.percentage}%)
        </text>
        <rect
          x="160"
          y="${offsetY}"
          width="${barWidth}"
          height="14"
          fill="${d.color}"
          rx="3" ry="3"
        />
      `;
        offsetY += 25;
    }

    return createResponsiveSVG({
        width,
        height,
        background,
        children: bars,
    });
}

/** Layout 2) Donut (horizontal) */
function renderDonutChart(langData, theme) {
    const width = 500;
    const height = 220;
    const cx = 120;
    const cy = height / 2;
    const outerRadius = 70;
    const strokeWidth = 30;

    const background = theme === 'dark' ? '#0d1117' : '#ffffff';
    const textColor = theme === 'dark' ? '#c9d1d9' : '#333333';

    if (langData.length === 0) {
        return createResponsiveSVG({
            width,
            height,
            background,
            children: noLangDataContent(width, height, textColor),
        });
    }

    // Build arcs
    let startAngle = 0;
    let arcs = '';
    for (const d of langData) {
        const angle = d.fraction * 360;
        const endAngle = startAngle + angle;
        const pathD = arcPath(cx, cy, outerRadius, startAngle, endAngle);

        arcs += `
        <path
          d="${pathD}"
          stroke="${d.color}"
          stroke-width="${strokeWidth}"
          fill="none"
        />
      `;
        startAngle = endAngle;
    }

    // Build legend
    let legend = `
      <text x="20" y="30" fill="${textColor}" font-size="18" font-family="sans-serif">
        Most Used Languages
      </text>
    `;
    let offsetY = 60;
    const legendX = 220;
    for (const d of langData) {
        legend += `
        <circle cx="${legendX}" cy="${offsetY}" r="5" fill="${d.color}" />
        <text x="${legendX + 12}" y="${offsetY + 4}" fill="${textColor}" font-size="14" font-family="sans-serif">
          ${d.lang} (${d.percentage}%)
        </text>
      `;
        offsetY += 20;
    }

    return createResponsiveSVG({
        width,
        height,
        background,
        children: arcs + legend,
    });
}

/** Layout 3) Donut Vertical (donut on top, legend below) */
function renderDonutVerticalChart(langData, theme) {
    const width = 400;
    const height = 350;
    const cx = width / 2;
    const cy = 120;
    const outerRadius = 70;
    const strokeWidth = 30;

    const background = theme === 'dark' ? '#0d1117' : '#ffffff';
    const textColor = theme === 'dark' ? '#c9d1d9' : '#333333';

    if (langData.length === 0) {
        return createResponsiveSVG({
            width,
            height,
            background,
            children: noLangDataContent(width, height, textColor),
        });
    }

    // Build arcs
    let startAngle = 0;
    let arcs = '';
    for (const d of langData) {
        const angle = d.fraction * 360;
        const endAngle = startAngle + angle;
        const pathD = arcPath(cx, cy, outerRadius, startAngle, endAngle);

        arcs += `
        <path
          d="${pathD}"
          stroke="${d.color}"
          stroke-width="${strokeWidth}"
          fill="none"
        />
      `;
        startAngle = endAngle;
    }

    // Legend below
    let legend = `
      <text x="20" y="30" fill="${textColor}" font-size="18" font-family="sans-serif">
        Most Used Languages
      </text>
    `;
    let offsetY = 220;
    const legendX = 40;
    for (const d of langData) {
        legend += `
        <circle cx="${legendX}" cy="${offsetY}" r="5" fill="${d.color}" />
        <text x="${legendX + 12}" y="${offsetY + 4}" fill="${textColor}" font-size="14" font-family="sans-serif">
          ${d.lang} (${d.percentage}%)
        </text>
      `;
        offsetY += 20;
    }

    return createResponsiveSVG({
        width,
        height,
        background,
        children: arcs + legend,
    });
}

/** Layout 4) Pie Chart (filled wedges) */
function renderPieChart(langData, theme) {
    const width = 400;
    const height = 220;
    const cx = width / 2;
    const cy = height / 2;
    const r = 80;

    const background = theme === 'dark' ? '#0d1117' : '#ffffff';
    const textColor = theme === 'dark' ? '#c9d1d9' : '#333333';

    if (langData.length === 0) {
        return createResponsiveSVG({
            width,
            height,
            background,
            children: noLangDataContent(width, height, textColor),
        });
    }

    let startAngle = 0;
    let wedges = `
      <text x="20" y="30" fill="${textColor}" font-size="18" font-family="sans-serif">
        Most Used Languages
      </text>
    `;
    for (const d of langData) {
        const angle = d.fraction * 360;
        const endAngle = startAngle + angle;

        const largeArcFlag = angle > 180 ? 1 : 0;
        const startX = cx + r * Math.cos(deg2rad(startAngle));
        const startY = cy + r * Math.sin(deg2rad(startAngle));
        const endX = cx + r * Math.cos(deg2rad(endAngle));
        const endY = cy + r * Math.sin(deg2rad(endAngle));

        const pathD = [
            `M ${cx} ${cy}`,
            `L ${startX} ${startY}`,
            `A ${r} ${r} 0 ${largeArcFlag} 1 ${endX} ${endY}`,
            'Z'
        ].join(' ');

        wedges += `
        <path
          d="${pathD}"
          fill="${d.color}"
        />
      `;
        startAngle = endAngle;
    }

    return createResponsiveSVG({
        width,
        height,
        background,
        children: wedges,
    });
}

/** Layout 5) Hidden bars (just a textual list) */
function renderHiddenBarsChart(langData, theme) {
    const width = 400;
    const height = 220;
    const background = theme === 'dark' ? '#0d1117' : '#ffffff';
    const textColor = theme === 'dark' ? '#c9d1d9' : '#333333';

    if (langData.length === 0) {
        return createResponsiveSVG({
            width,
            height,
            background,
            children: noLangDataContent(width, height, textColor),
        });
    }

    let items = `
      <text x="20" y="30" fill="${textColor}" font-size="18" font-family="sans-serif">
        Most Used Languages
      </text>
    `;
    let offsetY = 60;
    for (const d of langData) {
        items += `
        <text x="20" y="${offsetY}" fill="${textColor}" font-size="14" font-family="sans-serif">
          • ${d.lang} (${d.percentage}%)
        </text>
      `;
        offsetY += 20;
    }

    return createResponsiveSVG({
        width,
        height,
        background,
        children: items,
    });
}

/* ------------------------------------------------------------------
   MAIN RENDER FUNCTION
   ------------------------------------------------------------------ */
function renderChart(langs, layout, theme) {
    const langData = prepareLangData(langs);

    switch (layout) {
        case 'donut':
            return renderDonutChart(langData, theme);
        case 'donut-vertical':
            return renderDonutVerticalChart(langData, theme);
        case 'pie':
            return renderPieChart(langData, theme);
        case 'hidden':
            return renderHiddenBarsChart(langData, theme);
        case 'compact':
        default:
            return renderCompactChart(langData, theme);
    }
}

module.exports = {
    renderChart
};
