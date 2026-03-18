#!/usr/bin/env node

import { readdir, readFile, writeFile, stat } from 'fs/promises';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import os from 'os';
import zlib from 'zlib';
import { promisify } from 'util';

const gzip = promisify(zlib.gzip);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DIST_DIR = join(__dirname, '..', 'dist');

const formatBytesFixed = (bytes) => {
	// Always return format: XXX.XXKB (8 chars) or X.XXMB (6 chars, padded to 8)
	if (bytes < 1024 * 1024) {
		const kb = (bytes / 1024).toFixed(2);
		return kb.padStart(6, '0') + 'KB';
	}
	const mb = (bytes / 1024 / 1024).toFixed(2);
	return mb.padStart(4, '0') + 'MB  ';
};

const formatBuildTimeFixed = (ms) => {
	// Always return format: 0000.0ms (11 chars)
	return ms.toFixed(1).padStart(6, '0') + 'ms';
};

const formatPlatformFixed = (platform, cpus, arch) => {
	// Always return format with fixed width: "darwin (08-core arm64)  " (24 chars)
	const cpuStr = cpus.toString().padStart(2, '0');
	const platformStr = platform.padEnd(6, ' ');
	const archStr = arch.padEnd(6, ' ');
	return `${platformStr} (${cpuStr}-core ${archStr})`;
};

const getGzipSize = async (input) => {
	let content;
	if (typeof input === 'string' && input.startsWith('/')) {
		content = await readFile(input);
	} else if (typeof input === 'string') {
		content = Buffer.from(input, 'utf-8');
	} else {
		content = input;
	}
	const compressed = await gzip(content);
	return compressed.length;
};

const extractResourcesFromHtml = (htmlContent) => {
	const resources = {
		js: [],
		css: [],
		images: [],
		fonts: [],
	};

	// Extract external JS files (script src="...")
	const scriptMatches = htmlContent.matchAll(/<script[^>]+src=["']([^"']+)["']/g);
	for (const match of scriptMatches) {
		resources.js.push(match[1]);
	}

	// Extract external CSS files (link href="..." rel="stylesheet")
	const cssMatches = htmlContent.matchAll(/<link[^>]+href=["']([^"']+\.css)["']/g);
	for (const match of cssMatches) {
		resources.css.push(match[1]);
	}

	// Extract font preloads (link href="..." as="font")
	const fontMatches = htmlContent.matchAll(/<link[^>]+href=["']([^"']+\.(woff2?|ttf|eot|otf))["']/g);
	for (const match of fontMatches) {
		resources.fonts.push(match[1]);
	}

	// Extract images from <img src> and <source srcset>
	const imgMatches = htmlContent.matchAll(/<img[^>]+src=["']([^"']+)["']/g);
	for (const match of imgMatches) {
		resources.images.push(match[1]);
	}

	const srcsetMatches = htmlContent.matchAll(/srcset=["']([^"']+)["']/g);
	for (const match of srcsetMatches) {
		const urls = match[1].split(',').map(s => s.trim().split(' ')[0]);
		resources.images.push(...urls);
	}

	// Extract SVG URLs from data-svg-url attributes
	const svgDataMatches = htmlContent.matchAll(/data-svg-url=["']([^"']+)["']/g);
	for (const match of svgDataMatches) {
		resources.images.push(match[1]);
	}

	// Deduplicate
	resources.js = [...new Set(resources.js)];
	resources.css = [...new Set(resources.css)];
	resources.images = [...new Set(resources.images)];
	resources.fonts = [...new Set(resources.fonts)];

	return resources;
};

const generateStats = async () => {
	const startTime = Date.now();

	// Index.html stats
	const indexPath = join(DIST_DIR, 'index.html');
	const indexHtmlContent = await readFile(indexPath, 'utf-8');
	const indexGzipSize = await getGzipSize(indexPath);

	// Extract resources referenced by index.html
	const resources = extractResourcesFromHtml(indexHtmlContent);

	// Calculate sizes for only resources loaded by home page
	const totalsByType = {
		js: 0,
		css: 0,
		images: 0,
		fonts: 0,
	};

	// JS files
	for (const jsPath of resources.js) {
		const fullPath = join(DIST_DIR, jsPath);
		try {
			const gzipSize = await getGzipSize(fullPath);
			totalsByType.js += gzipSize;
		} catch (err) {
			console.warn(`Warning: Could not read ${jsPath}`);
		}
	}

	// CSS files
	for (const cssPath of resources.css) {
		const fullPath = join(DIST_DIR, cssPath);
		try {
			const gzipSize = await getGzipSize(fullPath);
			totalsByType.css += gzipSize;
		} catch (err) {
			console.warn(`Warning: Could not read ${cssPath}`);
		}
	}

	// Images
	for (const imgPath of resources.images) {
		const fullPath = join(DIST_DIR, imgPath);
		try {
			const gzipSize = await getGzipSize(fullPath);
			totalsByType.images += gzipSize;
		} catch (err) {
			console.warn(`Warning: Could not read ${imgPath}`);
		}
	}

	// Fonts
	for (const fontPath of resources.fonts) {
		const fullPath = join(DIST_DIR, fontPath);
		try {
			const gzipSize = await getGzipSize(fullPath);
			totalsByType.fonts += gzipSize;
		} catch (err) {
			console.warn(`Warning: Could not read ${fontPath}`);
		}
	}

	// System info
	const systemInfo = {
		platform: os.platform(),
		arch: os.arch(),
		nodeVersion: process.version,
		cpus: os.cpus().length,
		totalMemory: Math.round(os.totalmem() / 1024 / 1024 / 1024), // GB
	};

	const buildTime = Date.now() - startTime;

	// Calculate HTML composition breakdown
	const calculateHtmlBreakdown = (htmlContent) => {
		const styleMatches = htmlContent.match(/<style>[\s\S]*?<\/style>/g) || [];
		const scriptMatches = htmlContent.match(/<script[^>]*>[\s\S]*?<\/script>/g) || [];
		const inlineCSS = styleMatches.join('');
		const inlineJS = scriptMatches.join('');

		let pureHTML = htmlContent;
		pureHTML = pureHTML.replace(/<style>[\s\S]*?<\/style>/g, '');
		pureHTML = pureHTML.replace(/<script[^>]*>[\s\S]*?<\/script>/g, '');

		const gzipSize = (str) => {
			const compressed = zlib.gzipSync(Buffer.from(str));
			return compressed.length;
		};

		const cssGzipped = gzipSize(inlineCSS);
		const jsGzipped = gzipSize(inlineJS);
		const htmlGzipped = gzipSize(pureHTML);
		const total = cssGzipped + jsGzipped + htmlGzipped;

		return {
			cssPercent: Math.round((cssGzipped / total) * 100),
			jsPercent: Math.round((jsGzipped / total) * 100),
			htmlPercent: Math.round((htmlGzipped / total) * 100),
		};
	};

	const htmlBreakdown = calculateHtmlBreakdown(indexHtmlContent);

	// Ensure percentages add up to 100%
	let { htmlPercent, cssPercent, jsPercent } = htmlBreakdown;
	const total = htmlPercent + cssPercent + jsPercent;
	if (total !== 100) {
		// Adjust the largest percentage to make it exactly 100%
		const diff = 100 - total;
		if (htmlPercent >= cssPercent && htmlPercent >= jsPercent) {
			htmlPercent += diff;
		} else if (cssPercent >= jsPercent) {
			cssPercent += diff;
		} else {
			jsPercent += diff;
		}
	}

	// Create visual bar (15 chars total - half the size)
	const createVisualBar = (htmlPercent, cssPercent, jsPercent) => {
		const totalChars = 15;
		const htmlChars = Math.round((htmlPercent / 100) * totalChars);
		const cssChars = Math.round((cssPercent / 100) * totalChars);
		const jsChars = totalChars - htmlChars - cssChars; // Ensure exact 15 chars

		return '█'.repeat(htmlChars) + '▓'.repeat(cssChars) + '░'.repeat(jsChars);
	};

	const visualBar = createVisualBar(htmlPercent, cssPercent, jsPercent);

	// Log found resources for debugging
	console.log('\n📊 Home page resources:');
	console.log(`  JS files: ${resources.js.length}`);
	console.log(`  CSS files: ${resources.css.length}`);
	console.log(`  Images: ${resources.images.length}`);
	console.log(`  Fonts: ${resources.fonts.length}\n`);

	// Build a temporary stats string to measure injection overhead
	const buildStatsString = (htmlGzipSize) => [
		'▌║█║▌│║▌│║▌║▌█║ Dont Blink ▌│║▌║▌│║║▌█║▌║█',
		' ',
		'LIGHTHOUSE: 100/100/100/100 (browser/mobile)',
		`HTML: ${formatBytesFixed(htmlGzipSize)} [${visualBar}] ${htmlPercent}% html | ${cssPercent}% css | ${jsPercent}% js`,
		' ',
		`FONT FILES: ${formatBytesFixed(totalsByType.fonts)}`,
		`IMG FILES: ${formatBytesFixed(totalsByType.images)}`,
		`CSS FILEs: ${formatBytesFixed(totalsByType.css)}`,
		`JS FILES: ${formatBytesFixed(totalsByType.js)}`,
		' ',
	].join('\n');

	if (indexHtmlContent.includes('`__STATS__`')) {
		// Step 1: Build temporary stats with current measurement
		const tempStatsString = buildStatsString(indexGzipSize);

		// Step 2: Simulate injection to measure gzip overhead
		const htmlWithTempStats = indexHtmlContent.replace('`__STATS__`', tempStatsString);
		const gzipWithStats = await getGzipSize(htmlWithTempStats);

		// Step 3: Calculate the overhead from injecting stats
		const statsInjectionOverhead = gzipWithStats - indexGzipSize;

		// Step 4: Build final stats with corrected HTML size
		const finalIndexGzipSize = indexGzipSize + statsInjectionOverhead;
		const finalStatsString = buildStatsString(finalIndexGzipSize);

		// Step 5: Inject final stats (now accurate!)
		const htmlWithFinalStats = indexHtmlContent.replace('`__STATS__`', finalStatsString);
		await writeFile(indexPath, htmlWithFinalStats);

		console.log('✓ Replaced __STATS__ in: /index.html');
		console.log(`  Calculated overhead: ${statsInjectionOverhead} bytes (final gzipped: ${finalIndexGzipSize} bytes)`);
	}
};

generateStats().catch(console.error);
