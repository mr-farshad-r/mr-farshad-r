# SEO audit — 20 October 2026

## Findings

- The live site's 27 sitemap URLs returned HTTP 200, used self-referencing canonical URLs, and had no indexing prohibition. All were reachable through internal links.
- `/` deliberately canonicalizes to `/en/`; the unlocalized About and Blog pages canonicalize to their English versions. English and Persian pages have reciprocal language alternates. Keep these canonical choices.
- Search Console showed both language homepages indexed. Its page-indexing report (last updated 12 October) listed 23 discovered but not indexed URLs, three redirects, and one alternate with a proper canonical. These are not evidence of a sitewide `noindex` tag.
- The sitemap was successfully read on 19 October and contained 27 URLs. Indexing requests were accepted for `/about/en/` and `/blog/2026/10/10/finite-state-machine/` during this audit.
- The supplied Screaming Frog 20.2 crawl contained 94 URL records. Internal responses were successful; the failed or redirected responses belonged to external social/documentation links.
- Its embedded PageSpeed reports showed substantially slower articles than homepages. For `javascript-after-es6`, total blocking time was about 4.2 seconds and script evaluation about 4.1 seconds. These measurements do not isolate all CPU time to one script, but client-side syntax highlighting was avoidable work and its external stylesheet blocked rendering.

## Changes

- Use Jekyll's built-in Rouge highlighting during the build, with a local dark syntax theme. Remove Highlight.js and its external stylesheet from articles.
- Add visible author links and use the About page as the structured-data author URL.
- Allow large image previews while retaining the 404 page's `noindex`.
- Correct the GitHub profile's website link, which previously pointed to a nonexistent `/ref=github` path.
- Add an IndexNow ownership file for submitting canonical URLs to participating search engines.
- Add `scripts/check-seo.py` to validate the generated site's canonical URLs, metadata, crawler access, local resources, author links, language alternates, and internal discovery.

## Validation

Build the site, then run:

```sh
bundle exec jekyll build
python3 scripts/check-seo.py _site
```

This audit used locally installed Jekyll 4.4.1 and Rouge 4.7.0 with bundler loading disabled because the GitHub Pages bundle was unavailable locally. The changes use built-in Jekyll features supported by GitHub Pages. All 27 generated sitemap pages passed the checker; a deliberately incorrect canonical was rejected. A Persian article's syntax highlighting was visually checked.

## Search discovery

The existing robots policy permits Googlebot, Bingbot, OAI-SearchBot, PerplexityBot, and Claude-SearchBot. Allowing a crawler makes pages eligible for retrieval; it does not guarantee indexing or citations. A request using a crawler's user-agent also cannot prove connectivity from that crawler's actual network.

After deployment, verify the IndexNow ownership file is accessible and submit the sitemap's canonical URLs. HTTP 200 means received, and HTTP 202 means received with key validation pending; neither confirms indexing. For future content changes, submit the changed URLs, rather than repeatedly submitting unchanged pages.

Search Console reports can lag. Recheck the discovered URLs after Google recrawls them. Requests may take days or weeks and do not guarantee inclusion. Bing Webmaster Tools confirmed the sitemap was submitted and crawled successfully on 20 October, with 27 discovered URLs and no errors or warnings.

Sources: [Google recrawl guidance](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl), [OpenAI crawler documentation](https://developers.openai.com/api/docs/bots), [IndexNow protocol](https://www.indexnow.org/documentation), [Jekyll syntax highlighting](https://jekyllrb.com/docs/liquid/tags/#code-snippet-highlighting).

## Core Web Vitals implementation — 20 October 2026

- Article images now have 384, 768, and 1536-pixel WebP alternatives. The browser selects an appropriate size; original JPEGs remain as fallbacks and social-preview images. Across 22 images, the alternatives are respectively 96.4%, 89.6%, and 71.1% smaller than the originals.
- Hero images and the first blog thumbnail load eagerly; later thumbnails load lazily. Explicit dimensions preserve their layout space.
- The animated homepage tagline reserves enough space for every phrase and respects reduced-motion preferences. Font loading uses `display=optional` to avoid late font swaps on slow connections.
- The existing Clarity integration starts asynchronously without waiting for interaction or ten seconds. This reduces missed short visits; it also means Clarity's work is included in initial-load measurements.

### Visitor measurement

Use the existing [Clarity dashboard](https://clarity.microsoft.com/projects/view/l7t2mnoj0i/dashboard), under **Performance → Performance Overview / URL Performance**. Clarity natively reports LCP, INP, and CLS at the 75th percentile, so a second analytics SDK is unnecessary. Thresholds for good performance are LCP ≤ 2.5 seconds, INP ≤ 200 milliseconds, and CLS ≤ 0.1 (unitless).

The preview loaded the Clarity script successfully and its collection endpoint returned HTTP 204. Dashboard aggregation and production visitor percentiles still require incoming traffic. Ad blockers and browser support can limit measurement, and INP requires a qualifying interaction.

### Local lab comparison

Lighthouse 13.5.0, default mobile settings, one sequential run per version on localhost. Baseline is commit `31e6b8d`; each version was built with the same local Jekyll installation. External fonts and analytics were enabled. These are diagnostic lab results, not production field percentiles or a guaranteed score.

| Page | Performance score | LCP | CLS | Total blocking time |
| --- | --- | --- | --- | --- |
| FSM article, before | 86 | 4.20 s | 0.0094 | 0 ms |
| FSM article, after | 100 | 1.36 s | 0 | 46 ms |
| Persian homepage, before | 97 | 2.55 s | 0.0408 | 0 ms |
| Persian homepage, after | 100 | 1.05 s | 0.0056 | 2 ms |

Total blocking time is a lab diagnostic, not INP. The article audit selected the 768-pixel WebP at about 34 KB. Visual checks confirmed Persian typography, stable tagline height across different phrases, and thumbnail rendering. All 27 pages passed the SEO checker, including responsive-image file checks. A JavaScript execution check confirmed asynchronous analytics startup and no typing timers when reduced motion is requested.

When adding or replacing article JPEGs, run `python3 scripts/optimize-images.py` (requires `cwebp`), build the site, and run the SEO checker before publishing. Unknown images retain their JPEG fallback until alternatives are generated.

References: [Clarity Performance widget](https://learn.microsoft.com/en-us/clarity/insights/performance-widget), [Clarity installation verification](https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-setup), [Google LCP optimization](https://web.dev/articles/optimize-lcp).
