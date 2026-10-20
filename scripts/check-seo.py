"""Check a built Jekyll site: python3 scripts/check-seo.py /path/to/site."""

import json
import sys
import xml.etree.ElementTree as ET
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urljoin, urlsplit
from urllib.robotparser import RobotFileParser


class Page(HTMLParser):
    def __init__(self, html):
        super().__init__()
        self.tags = []
        self.schema = []
        self.json_text = None
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        self.tags.append((tag, attrs))
        if tag == "script" and attrs.get("type") == "application/ld+json":
            self.json_text = ""

    def handle_data(self, data):
        if self.json_text is not None:
            self.json_text += data

    def handle_endtag(self, tag):
        if tag == "script" and self.json_text is not None:
            self.schema.append(json.loads(self.json_text))
            self.json_text = None

    def select(self, tag, **attrs):
        return [a for t, a in self.tags
                if t == tag and all(a.get(k) == v for k, v in attrs.items())]


def check(root):
    sitemap = ET.parse(root / "sitemap.xml")
    urls = [e.text for e in sitemap.findall(".//{*}loc")]
    assert urls and len(urls) == len(set(urls)), "Empty or duplicate sitemap"
    origin = "https://roozbahani.com"
    robots = RobotFileParser()
    robots.parse((root / "robots.txt").read_text().splitlines())
    pages = {}

    def path_for(url):
        path = root / unquote(urlsplit(url).path).lstrip("/")
        return path / "index.html" if path.is_dir() else path

    for url in [origin + "/"] + urls:
        assert url.startswith(origin + "/"), f"Unexpected sitemap origin: {url}"
        html = path_for(url).read_text()
        page = pages[url] = Page(html)
        canonical = page.select("link", rel="canonical")
        expected = origin + "/en/" if url == origin + "/" else url
        assert len(canonical) == 1 and canonical[0]["href"] == expected, url
        assert len(page.select("h1")) == 1, f"Expected one H1: {url}"
        assert page.select("title"), f"Missing title: {url}"
        assert page.select("meta", name="description")[0].get("content"), url
        for meta in page.select("meta"):
            if meta.get("name", "").lower() in ("robots", "googlebot"):
                assert "noindex" not in meta.get("content", "").lower(), url
        assert page.schema, f"Missing structured data: {url}"
        for agent in ("Googlebot", "bingbot", "OAI-SearchBot", "PerplexityBot",
                      "Claude-SearchBot"):
            assert robots.can_fetch(agent, url), f"{agent} blocked: {url}"
        for tag, attrs in page.tags:
            target = attrs.get("src") if tag in ("img", "script") else attrs.get("href")
            if not target:
                continue
            target = urljoin(url, target)
            if urlsplit(target).netloc == "roozbahani.com":
                assert path_for(target).is_file(), f"Broken resource: {url} -> {target}"
        if page.schema[0].get("@type") == "BlogPosting":
            assert page.select("a", rel="author"), f"Missing author link: {url}"
            assert "highlight.min.js" not in html and "hljs.highlightAll" not in html, url
            if "<pre" in html:
                assert page.select("div", **{"class": "highlight"}), url

    for url, page in pages.items():
        alternates = {a["hreflang"]: a["href"] for a in page.select("link", rel="alternate")
                      if "hreflang" in a}
        for target in alternates.values():
            assert target in pages, f"Alternate absent from sitemap: {target}"
            other = {a["hreflang"]: a["href"] for a in pages[target].select("link", rel="alternate")
                     if "hreflang" in a}
            assert other == alternates, f"Inconsistent language alternates: {url}"

    reached = {origin + "/"}
    while True:
        discovered = {urljoin(url, a["href"]).split("#")[0]
                      for url in reached if url in pages
                      for a in pages[url].select("a") if "href" in a}
        expanded = reached | (discovered & pages.keys())
        if expanded == reached:
            break
        reached = expanded
    assert set(urls) <= reached, f"Orphan pages: {set(urls) - reached}"
    assert "noindex" in (root / "404.html").read_text(), "404 should stay excluded"
    print(f"PASS: {len(urls)} sitemap pages; canonicals, crawler access, metadata, "
          "structured data, author links, local resources, hreflang, and discovery.")


if __name__ == "__main__":
    check(Path(sys.argv[1] if len(sys.argv) > 1 else "_site"))
