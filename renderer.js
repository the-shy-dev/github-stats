// renderer.js

// 1. Expanded language color map
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
  'Objective-C': '#438eff',
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

/** Convert degrees to radians */
function deg2rad(deg) {
  return (deg * Math.PI) / 180;
}

/**
 * If there's no language data, return a centered message.
 */
function noLangDataContent(width, height, textColor) {
  return `
    <text x="${width / 2}" y="${height / 2}" fill="${textColor}" font-size="16"
      text-anchor="middle" alignment-baseline="middle">
      No languages found
    </text>
  `;
}

/**
 * Create a responsive SVG wrapper:
 * - viewBox for scaling
 * - style="max-width: 100%; height: auto;" so it fits containers
 * - preserveAspectRatio to keep it centered
 */
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

/**
 * Prepare language data:
 *  - Sum up total
 *  - Sort descending
 *  - Calculate fraction & percentage
 *  - If too many items, group the extras into "Other"
 */
function prepareLangData(langs) {
  const total = Object.values(langs).reduce((a, b) => a + b, 0);
  if (total === 0) return [];

  // Convert to array of [lang, bytes], sorted descending
  let entries = Object.entries(langs).sort((a, b) => b[1] - a[1]);

  // Optional: cap the number of items we display in the legend
  const MAX_ITEMS = 6;
  if (entries.length > MAX_ITEMS) {
    const top = entries.slice(0, MAX_ITEMS);
    const rest = entries.slice(MAX_ITEMS);
    const restSum = rest.reduce((acc, [_, bytes]) => acc + bytes, 0);
    top.push(['Other', restSum]);
    entries = top;
  }

  // Map each entry to a consistent object
  return entries.map(([lang, bytes]) => {
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

/**
 * Return an SVG path "d" for an arc from startAngle to endAngle (used in donut/pie).
 */
function arcPath(cx, cy, r, startAngle, endAngle) {
  const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;
  const startX = cx + r * Math.cos(deg2rad(startAngle));
  const startY = cy + r * Math.sin(deg2rad(startAngle));
  const endX = cx + r * Math.cos(deg2rad(endAngle));
  const endY = cy + r * Math.sin(deg2rad(endAngle));

  return [
    `M ${startX} ${startY}`,
    `A ${r} ${r} 0 ${largeArcFlag} 1 ${endX} ${endY}`
  ].join(' ');
}

/* ------------------------------------------------------------------
   LAYOUT RENDERERS
   ------------------------------------------------------------------ */

/** 1) COMPACT LAYOUT: horizontal bars + text */
function renderCompactChart(langData, theme) {
  const width = 500;
  const height = 300;

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

  const maxBarWidth = 250;
  const maxBytes = Math.max(...langData.map(d => d.bytes));

  // Title
  let bars = `
    <text x="20" y="30" fill="${textColor}" font-size="20" font-family="sans-serif" font-weight="bold">
      Most Used Languages
    </text>
  `;

  // Render each bar
  let offsetY = 60;
  for (const d of langData) {
    const barWidth = (d.bytes / maxBytes) * maxBarWidth;
    bars += `
      <text x="20" y="${offsetY + 14}" fill="${textColor}" font-size="14" font-family="sans-serif">
        ${d.lang} (${d.percentage}%)
      </text>
      <rect
        x="200"
        y="${offsetY}"
        width="${barWidth}"
        height="14"
        fill="${d.color}"
        rx="3" ry="3"
      />
    `;
    offsetY += 30;
  }

  return createResponsiveSVG({
    width,
    height,
    background,
    children: bars,
  });
}

/** 2) DONUT LAYOUT (chart on the left, legend on the right) */
function renderDonutChart(langData, theme) {
  const width = 600;
  const height = 300;
  // Center the donut around (150, 150)
  const cx = 150;
  const cy = height / 2;
  const outerRadius = 80;
  const strokeWidth = 25;

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

  // Draw arcs
  let startAngle = 0;
  let arcs = `
    <text x="20" y="30" fill="${textColor}" font-size="20" font-family="sans-serif" font-weight="bold">
      Most Used Languages
    </text>
  `;
  for (const d of langData) {
    const angle = d.fraction * 360;
    const endAngle = startAngle + angle;
    const dPath = arcPath(cx, cy, outerRadius, startAngle, endAngle);

    arcs += `
      <path
        d="${dPath}"
        stroke="${d.color}"
        stroke-width="${strokeWidth}"
        fill="none"
      />
    `;
    startAngle = endAngle;
  }

  // Legend to the right
  let legend = '';
  let offsetY = 60;
  const legendX = 320;
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

/** 3) DONUT-VERTICAL LAYOUT (donut on top, legend below) */
function renderDonutVerticalChart(langData, theme) {
  const width = 400;
  const height = 350;
  // Center the donut around (width/2, 120)
  const cx = width / 2;
  const cy = 120;
  const outerRadius = 80;
  const strokeWidth = 25;

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

  // Draw arcs
  let startAngle = 0;
  let arcs = `
    <text x="20" y="30" fill="${textColor}" font-size="20" font-family="sans-serif" font-weight="bold">
      Most Used Languages
    </text>
  `;
  for (const d of langData) {
    const angle = d.fraction * 360;
    const endAngle = startAngle + angle;
    const dPath = arcPath(cx, cy, outerRadius, startAngle, endAngle);

    arcs += `
      <path
        d="${dPath}"
        stroke="${d.color}"
        stroke-width="${strokeWidth}"
        fill="none"
      />
    `;
    startAngle = endAngle;
  }

  // Legend below
  let legend = '';
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

/** 4) PIE CHART LAYOUT (filled wedges, legend on the right) */
function renderPieChart(langData, theme) {
  const width = 600;
  const height = 300;
  // Center the pie around (150, 150)
  const cx = 150;
  const cy = 150;
  const r = 100;

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

  // Build wedges
  let startAngle = 0;
  let wedges = `
    <text x="20" y="30" fill="${textColor}" font-size="20" font-family="sans-serif" font-weight="bold">
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
      'Z',
    ].join(' ');

    wedges += `
      <path
        d="${pathD}"
        fill="${d.color}"
      />
    `;
    startAngle = endAngle;
  }

  // Legend on the right
  let legend = '';
  let offsetY = 60;
  const legendX = 320;
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
    children: wedges + legend,
  });
}

/** 5) HIDDEN BARS LAYOUT (text list only) */
function renderHiddenBarsChart(langData, theme) {
  const width = 500;
  const height = 300;

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
    <text x="20" y="30" fill="${textColor}" font-size="20" font-family="sans-serif" font-weight="bold">
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
  // Convert raw object to an array of { lang, bytes, fraction, percentage, color }
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
