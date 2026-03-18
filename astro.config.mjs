import { defineConfig } from 'astro/config';
import Compress from '@playform/compress';
import playformInline from '@playform/inline';
import rename from 'astro-rename';

export default defineConfig({
	output: 'static',
	scopedStyleStrategy: 'class',
	site: 'https://samseabourn.github.io',
	base: '/portfolio',
	integrations: [
		rename({
			rename: {
				strategy: (name) =>
					name.replace(/^astro-/, 'a-'),
				by: 'whole'
			}
		}),
		Compress({
			CSS: true,
			HTML: true,
			Image: false,
			JavaScript: true,
			SVG: false,
			Logger: 2,
		}),
		playformInline({
			Beasties: true,
			Fonts: true,
			SVG: false,
			Logger: 2
		}),
	],
	vite: {
		plugins: [],
		server: {
			host: true,
		},
		esbuild: {
			drop: ['console', 'debugger'],
		},
	},
});