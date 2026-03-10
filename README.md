# Hi, thank you for reading me

As a README, this is the most I can hope for someone actually viewing this file.

You're probably here because you noticed this website is **a little fast**. Maybe you ran Lighthouse and saw those perfect 100s. Maybe you opened DevTools and watched it paint in 800ms. Maybe you're just here because you appreciate a good loading spinner that never appears.

This is my personal portfolio. It's also a love letter/my personal testing grounds for web performance.

No runtime framework bloat. No image laziness (well, _strategic_ laziness). No (_some_) compromises.

---

## **The Philosophy**

This site proves a point: **performance is a feature**. Every design decision, every line of code, every asset optimized for speed without sacrificing aesthetics. Brutalist design meets brutally efficient engineering.

---

## **How I Got to 100/100/100/100**

Here's every optimization I made to squeeze milliseconds out of this portfolio:

- **1-bit & 2-bit PNGs** - Hero images are 1-bit colormapped PNGs (3.9KB-23KB)
- **Hand-optimized for web** - No automatic processing, manually quantized
- **Responsive srcsets** - Different sizes for mobile/tablet/desktop
- **Strategic loading** - `fetchpriority="high"` on hero, `loading="lazy"` below fold
- **WebP compression** - Used `cwebp -alpha_q 30` for aggressive transparency compression
- **Double font subset strategy** - Core font (1.1KB, ASCII only) loads instantly
- **Progressive enhancement** - Full subset (12KB) loads as fallback for extended characters
- **Preloaded** - Core font uses `<link rel="preload">` for immediate fetch
- **Unicode ranges** - `U+0020-007F` (core) → `U+0000-FFFF` (full)
- **font display: swap** - Zero FOIT (Flash of Invisible Text)
- **Hand optimized SVGs** - Every SVG manually cleaned (789B-3.9KB each)
- **Lazy mounted SVG animations** - SVGs fetched and injected only when needed
- **Intersection Observer** - Below fold icons load when entering viewport
- **No inline SVG bloat** - SVGs stored as separate assets, not embedded in HTML
- **Deferred JS execution** - `requestIdleCallback` for non-critical animations
- **First interaction listener** - Hero animations wait for user engagement
- **IntersectionObserver** - Viewport-based lazy loading
- **Zero console logs** - Vite esbuild strips `console` and `debugger` in production
- **Dynamic keyframe injection** - SVG animations generate CSS on-demand, then clean up
- **Astro static generation** - Zero client side hydration
- **@playform/compress** - Minifies CSS, HTML, JavaScript
- **@playform/inline** - Inlines critical CSS and fonts (Beasties)
- **astro-rename** - Shortens class names (`astro-` → `a-`)
- **GPU acceleration** - `transform: translateZ(0)` and `will-change` hints
- **Mobile first** - Base styles for mobile, progressive enhancement via `min-width`
- **Scoped styles** - Component-level CSS for minimal specificity
- **Core Web Vitals tracking** - LCP, CLS, TBT measured via PerformanceObserver
- **Build time stats** - Custom script calculates all asset sizes post-build
- **Runtime stats** - Metrics injected into page and logged to console

---

## **Additional Juice to Squeeze**

If you're looking to push performance even further, here's what could move the needle:

- **Global CSS over scoped** - Switch from component scoped styles to a single global stylesheet (reduces duplicate selectors, smaller total CSS)
- **Brotli compression** - Add `.br` compression alongside gzip for 10-15% smaller transfers
- **Cache headers** - Configure immutable cache headers for hashed assets (`max-age=31536000`)
- **Resource hints** - Prefetch hero SVGs during idle time to speed up first interaction
- **Remove unused `will-change`** - Only keep on actively animating elements to reduce memory overhead

These are all diminishing returns at this point. The site already scores 100/100/100/100.

---

## **The Stack**

- **Framework**: Astro 5.17.3 (static site generation)
- **Language**: TypeScript (strict mode)
- **Package Manager**: Yarn
- **Build Tool**: Vite 7.3.0
- **Output**: Pure static HTML (no runtime dependencies)
- **Hand Optimised SVG**: no regrets

---

## **Run It Yourself**

```bash
yarn dev      # Start dev server
yarn build && yarn preview   # Build and preview on port 4321
```

---

Sam Seabourn - 2026
