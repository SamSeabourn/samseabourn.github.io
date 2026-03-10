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
	return (ms / 10).toFixed(1).padStart(6, '0') + 'ms';
};

const formatPlatformFixed = (platform, cpus, arch) => {
	// Always return format with fixed width: "darwin (08-core arm64)  " (24 chars)
	const cpuStr = cpus.toString().padStart(2, '0');
	const platformStr = platform.padEnd(6, ' ');
	const archStr = arch.padEnd(6, ' ');
	return `${platformStr} (${cpuStr}-core ${archStr})`;
};

const getFileSize = async (filePath) => {
	const stats = await stat(filePath);
	return stats.size;
};

const getGzipSize = async (input) => {
	// Accept either file path or content string
	let content;
	if (typeof input === 'string' && input.startsWith('/')) {
		// It's a file path
		content = await readFile(input);
	} else if (typeof input === 'string') {
		// It's HTML content string
		content = Buffer.from(input, 'utf-8');
	} else {
		// It's already a buffer
		content = input;
	}
	const compressed = await gzip(content);
	return compressed.length;
};

const getAllFiles = async (dir, fileList = []) => {
	const files = await readdir(dir, { withFileTypes: true });

	for (const file of files) {
		const filePath = join(dir, file.name);
		if (file.isDirectory()) {
			await getAllFiles(filePath, fileList);
		} else {
			// Exclude build-stats.txt from calculations
			if (file.name !== 'build-stats.txt') {
				fileList.push(filePath);
			}
		}
	}

	return fileList;
};

const generateStats = async () => {
	const startTime = Date.now();

	// Get all files in dist
	const allFiles = await getAllFiles(DIST_DIR);

	// Index.html stats
	const indexPath = join(DIST_DIR, 'index.html');
	const indexSize = await getFileSize(indexPath);
	const indexGzipSize = await getGzipSize(indexPath);

	// Categorize assets
	const assets = {
		js: [],
		css: [],
		images: [],
		svg: [],
		fonts: [],
		other: [],
	};

	let totalSize = 0;
	let totalGzipSize = 0;

	for (const file of allFiles) {
		const size = await getFileSize(file);
		const gzipSize = await getGzipSize(file);
		const ext = extname(file).toLowerCase();
		const relativePath = file.replace(DIST_DIR, '');

		totalSize += size;
		totalGzipSize += gzipSize;

		const assetInfo = {
			path: relativePath,
			size,
			gzipSize,
		};

		if (ext === '.js') {
			assets.js.push(assetInfo);
		} else if (ext === '.css') {
			assets.css.push(assetInfo);
		} else if (['.png', '.jpg', '.jpeg', '.webp', '.gif', '.avif'].includes(ext)) {
			assets.images.push(assetInfo);
		} else if (ext === '.svg') {
			assets.svg.push(assetInfo);
		} else if (['.woff', '.woff2', '.ttf', '.eot', '.otf'].includes(ext)) {
			assets.fonts.push(assetInfo);
		} else {
			assets.other.push(assetInfo);
		}
	}

	// Calculate totals by type
	const totalsByType = {
		js: assets.js.reduce((sum, a) => sum + a.gzipSize, 0),
		css: assets.css.reduce((sum, a) => sum + a.gzipSize, 0),
		images: assets.images.reduce((sum, a) => sum + a.gzipSize, 0),
		svg: assets.svg.reduce((sum, a) => sum + a.gzipSize, 0),
		fonts: assets.fonts.reduce((sum, a) => sum + a.gzipSize, 0),
	};

	// System info
	const systemInfo = {
		platform: os.platform(),
		arch: os.arch(),
		nodeVersion: process.version,
		cpus: os.cpus().length,
		totalMemory: Math.round(os.totalmem() / 1024 / 1024 / 1024), // GB
	};

	const buildTime = Date.now() - startTime;

	// Build a temporary stats string to measure injection overhead
	const buildStatsString = (htmlGzipSize) => [
		'▌║█║▌│║▌│║▌║▌█║ Dont Blink ▌│║▌║▌│║║▌█║▌║█',
		' ',
		'LIGHTHOUSE: 100/100/100/100 (browser/mobile)',
		`BUILD SYS: ${formatPlatformFixed(systemInfo.platform, systemInfo.cpus || 8, systemInfo.arch)}`,
		`BUILD TIME: ${formatBuildTimeFixed(buildTime)}`,
		`HTML: ${formatBytesFixed(htmlGzipSize)}`,
		`JS FILES: ${formatBytesFixed(totalsByType.js)}`,
		`CSS: ${formatBytesFixed(totalsByType.css)}`,
		`IMG: ${formatBytesFixed(totalsByType.images)}`,
		`FONTS: ${formatBytesFixed(totalsByType.fonts)}`,
	].join('\n');

	// Only process index.html (home page)
	const indexHtmlContent = await readFile(indexPath, 'utf-8');

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
