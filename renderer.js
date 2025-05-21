const languageColors = {
  JavaScript:    '#f1e05a',
  TypeScript:    '#2b7489',
  HTML:          '#e34c26',
  CSS:           '#563d7c',
  SCSS:          '#c6538c',
  Python:        '#3572A5',
  Java:          '#b07219',
  C:             '#555555',
  'C++':         '#f34b7d',
  'C#':          '#178600',
  Go:            '#00ADD8',
  PHP:           '#777bb4',
  Ruby:          '#cc342d',
  Swift:         '#ffac45',
  Kotlin:        '#F18E33',
  Dart:          '#00B4AB',
  Rust:          '#dea584',
  R:             '#198CE7',
  Scala:         '#c22d40',
  Shell:         '#89e051',
  'Objective-C': '#438eff',
  Perl:          '#0298c3',
  Lua:           '#000080',
  Haskell:       '#5e5086',
  Elixir:        '#6e4a7e',
  Clojure:       '#db5855',
  Groovy:        '#4298b8',
  CoffeeScript:  '#244776',
  Erlang:        '#B83998',
  OCaml:         '#3be133',
  PowerShell:    '#012456',
  Vimscript:     '#199f4b',
  Makefile:      '#427819',
  // ... add or adjust as needed
  Other:         '#cccccc' 
};


const MAX_SVG_WIDTH  = 500;
const MAX_SVG_HEIGHT = 300;

function getThemeColors(theme) {
  if (theme === 'dark') {
    return { background: '#0d1117', textColor: '#c9d1d9' };
  } else if (theme === 'blue') {
    return { background: '#e0f7fa', textColor: '#006064' };
  } else if (theme === 'solarized') {
    return { background: '#fdf6e3', textColor: '#657b83' };
  } else {
        // default light theme
        return { background: '#ffffff', textColor: '#333333' };
  }
}

// Utility functions
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
 * - viewBox for scaling.
 * - style="max-width: 100%; height: auto;" so it fits containers.
 * - preserveAspectRatio to keep it centered.
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
 * Prepare language data (capped at 15):
 *  - Sum total bytes.
 *  - Sort descending.
 *  - Calculate fraction & percentage.
 *  - If too many items, group the extras into "Other".
 */
function prepareLangData(langs, MAX_ITEMS) {
  const total = Object.values(langs).reduce((a, b) => a + b, 0);
  if (total === 0) return [];

  let entries = Object.entries(langs).sort((a, b) => b[1] - a[1]);
  if (entries.length > MAX_ITEMS) {
    const top = entries.slice(0, MAX_ITEMS);
    const rest = entries.slice(MAX_ITEMS);
    const restSum = rest.reduce((acc, [_, bytes]) => acc + bytes, 0);
    top.push(['Other', restSum]);
    entries = top;
  }

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

/**
 * Append a small activity streak text at the bottom right if provided.
 * Assumes the dimensions and textColor are known.
 */
function appendStreak(width, height, textColor, streak) {
  if (streak && Number(streak) > 0) {
    return `
      <text x="${width - 10}" y="${height - 10}" fill="${textColor}" font-size="12" text-anchor="end" font-family="sans-serif">
        Activity Streak: ${streak} days
      </text>
    `;
  }
  return '';
}

// --- Layout renderers with dynamic + clamped dimensions ---

/** 1) Compact */
function renderCompactChart(langData, theme, streak) {
  const width = DEFAULT_WIDTH = 500;
  const itemSpacing   = 30;
  const headerHeight  = 60;
  const bottomPadding = 30;
  let height = headerHeight + langData.length * itemSpacing + bottomPadding;

  // clamp
  const w = Math.min(width, MAX_SVG_WIDTH);
  const h = Math.min(height, MAX_SVG_HEIGHT);

  const { background, textColor } = getThemeColors(theme);
  if (langData.length === 0) {
    return createResponsiveSVG({
      width: w,
      height: h,
      background,
      children: noLangDataContent(w, h, textColor),
    });
  }

  const maxBarWidth = 250;
  const maxBytes   = Math.max(...langData.map(d => d.bytes));
  let bars = `
    <text x="20" y="30" fill="${textColor}" font-size="20" font-family="sans-serif" font-weight="bold">
      Most Used Languages
    </text>
  `;
  let offsetY = 60;
  for (const d of langData) {
    const barWidth = (d.bytes / maxBytes) * maxBarWidth;
    bars += `
      <text x="20" y="${offsetY + 14}" fill="${textColor}" font-size="14" font-family="sans-serif">
        ${d.lang} (${d.percentage}%)
      </text>
      <rect x="200" y="${offsetY}" width="${barWidth}" height="14" fill="${d.color}" rx="3" ry="3" />
    `;
    offsetY += itemSpacing;
  }
  bars += appendStreak(w, h, textColor, streak);

  return createResponsiveSVG({ width: w, height: h, background, children: bars });
}

/** 2) Donut (horizontal) */
function renderDonutChart(langData, theme, streak) {
  const baseWidth     = 600;
  const legendStart   = 60;
  const legendSpacing = 20;
  const bottomPadding = 30;
  let height = Math.max(
    300,
    legendStart + langData.length * legendSpacing + bottomPadding
  );

  const w = Math.min(baseWidth, MAX_SVG_WIDTH);
  const h = Math.min(height, MAX_SVG_HEIGHT);

  const cx = 150;
  const cy = h / 2;
  const outerRadius = 80;
  const strokeWidth = 25;
  const { background, textColor } = getThemeColors(theme);

  if (langData.length === 0) {
    return createResponsiveSVG({ width: w, height: h, background, children: noLangDataContent(w, h, textColor) });
  }

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
    arcs += `<path d="${dPath}" stroke="${d.color}" stroke-width="${strokeWidth}" fill="none" />`;
    startAngle = endAngle;
  }

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
    offsetY += legendSpacing;
  }
  const content = arcs + legend + appendStreak(w, h, textColor, streak);
  return createResponsiveSVG({ width: w, height: h, background, children: content });
}

/** 3) Donut (vertical) */
function renderDonutVerticalChart(langData, theme, streak) {
  const baseWidth     = 400;
  const legendStart   = 220;
  const legendSpacing = 20;
  const bottomPadding = 30;
  let height = Math.max(
    350,
    legendStart + langData.length * legendSpacing + bottomPadding
  );

  const w = Math.min(baseWidth, MAX_SVG_WIDTH);
  const h = Math.min(height, MAX_SVG_HEIGHT);

  const cx = w / 2;
  const cy = 120;
  const outerRadius = 80;
  const strokeWidth = 25;
  const { background, textColor } = getThemeColors(theme);

  if (langData.length === 0) {
    return createResponsiveSVG({ width: w, height: h, background, children: noLangDataContent(w, h, textColor) });
  }

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
    arcs += `<path d="${dPath}" stroke="${d.color}" stroke-width="${strokeWidth}" fill="none" />`;
    startAngle = endAngle;
  }

  let legend = '';
  let offsetY = legendStart;
  const legendX = 40;
  for (const d of langData) {
    legend += `
      <circle cx="${legendX}" cy="${offsetY}" r="5" fill="${d.color}" />
      <text x="${legendX + 12}" y="${offsetY + 4}" fill="${textColor}" font-size="14" font-family="sans-serif">
        ${d.lang} (${d.percentage}%)
      </text>
    `;
    offsetY += legendSpacing;
  }
  const content = arcs + legend + appendStreak(w, h, textColor, streak);
  return createResponsiveSVG({ width: w, height: h, background, children: content });
}

/** 4) Pie */
function renderPieChart(langData, theme, streak) {
  const baseWidth     = 600;
  const legendStart   = 60;
  const legendSpacing = 20;
  const bottomPadding = 30;
  let height = Math.max(
    300,
    legendStart + langData.length * legendSpacing + bottomPadding
  );

  const w = Math.min(baseWidth, MAX_SVG_WIDTH);
  const h = Math.min(height, MAX_SVG_HEIGHT);

  const cx = 150;
  const cy = h / 2;
  const r = 100;
  const { background, textColor } = getThemeColors(theme);

  if (langData.length === 0) {
    return createResponsiveSVG({ width: w, height: h, background, children: noLangDataContent(w, h, textColor) });
  }

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
      'Z'
    ].join(' ');
    wedges += `<path d="${pathD}" fill="${d.color}" />`;
    startAngle = endAngle;
  }

  let legend = '';
  let offsetY = legendStart;
  const legendX = 320;
  for (const d of langData) {
    legend += `
      <circle cx="${legendX}" cy="${offsetY}" r="5" fill="${d.color}" />
      <text x="${legendX + 12}" y="${offsetY + 4}" fill="${textColor}" font-size="14" font-family="sans-serif">
        ${d.lang} (${d.percentage}%)
      </text>
    `;
    offsetY += legendSpacing;
  }
  const content = wedges + legend + appendStreak(w, h, textColor, streak);
  return createResponsiveSVG({ width: w, height: h, background, children: content });
}

/** 5) Hidden bars */
function renderHiddenBarsChart(langData, theme, streak) {
  const width        = 500;
  const itemSpacing  = 20;
  const headerHeight = 60;
  const bottomPad    = 30;
  let height = headerHeight + langData.length * itemSpacing + bottomPad;

  const w = Math.min(width, MAX_SVG_WIDTH);
  const h = Math.min(height, MAX_SVG_HEIGHT);

  const { background, textColor } = getThemeColors(theme);
  if (langData.length === 0) {
    return createResponsiveSVG({ width: w, height: h, background, children: noLangDataContent(w, h, textColor) });
  }
  let items = `
    <text x="20" y="30" fill="${textColor}" font-size="20" font-family="sans-serif" font-weight="bold">
      Most Used Languages
    </text>
  `;
  let offsetY = headerHeight;
  for (const d of langData) {
    items += `
      <text x="20" y="${offsetY}" fill="${textColor}" font-size="14" font-family="sans-serif">
        • ${d.lang} (${d.percentage}%)
      </text>
    `;
    offsetY += itemSpacing;
  }
  items += appendStreak(w, h, textColor, streak);
  return createResponsiveSVG({ width: w, height: h, background, children: items });
}

/**
 * renderChart now accepts four parameters:
 *   - langs: language usage object (from fetcher)
 *   - layout: one of 'compact', 'donut', 'donut-vertical', 'pie', or 'hidden'
 *   - theme: one of 'light', 'dark', 'blue', or 'solarized'
 *   - streak: (optional) activity streak (number of consecutive days)
 */
function renderChart(langs, layout, theme, streak, max_items) {
  // Cap the number of items displayed (default: 6, max: 15); group extra languages into "Other"
  const MAX_ITEMS = Math.min(max_items, 15);
  const langData = prepareLangData(langs, MAX_ITEMS);
  switch (layout) {
    case 'donut':           
    return renderDonutChart(langData, theme, streak, MAX_ITEMS);
    case 'donut-vertical':  
    return renderDonutVerticalChart(langData, theme, streak, MAX_ITEMS);
    case 'pie':             
    return renderPieChart(langData, theme, streak, MAX_ITEMS);
    case 'hidden':          
    return renderHiddenBarsChart(langData, theme, streak, MAX_ITEMS);
    case 'compact':
    default:                
    return renderCompactChart(langData, theme, streak, MAX_ITEMS);
  }
}

module.exports = { 
  renderChart 
};
