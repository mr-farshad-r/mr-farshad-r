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
