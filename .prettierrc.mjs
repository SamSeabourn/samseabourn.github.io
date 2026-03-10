/** @type {import("prettier").Config} */
export default {
	printWidth: 100,
	useTabs: true,
	tabWidth: 2,
	semi: true,
	singleQuote: true,
	jsxSingleQuote: false,
	trailingComma: 'es5',
	bracketSameLine: false,
	bracketSpacing: true,
	arrowParens: 'always',
	endOfLine: 'lf',
	quoteProps: 'consistent',
	plugins: ['prettier-plugin-astro'],
	pluginSearchDirs: ['.'],
	overrides: [
		{
			files: ['**/*.astro', '**/*.html', '**/*.mjs', '**/*.js', '**/*.ts'],
			options: {
				parser: 'astro',
			},
		},
		{
			files: ['**/*.json'],
			options: {
				tabWidth: 2,
			},
		},
	],
};
