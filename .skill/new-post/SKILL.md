---
name: new-post
description: Create or revise a blog post in this repository, including language metadata, researched content, a matching generated cover, and responsive image assets. Use for new articles and their cover images.
---

# New blog post

Deliver a complete article in `_posts/` with its own cover in `assets/images/posts/`. Follow the user's topic, language, and scope. Creating local files does not authorize committing, pushing, or publishing them.

## Read the relevant conventions

Resolve paths below from the repository root, not this skill directory. Before writing, read one recent post and one similar in topic or format. Useful examples:

- `_posts/2026-10-25-building-good-apps-with-ai.md`: English practical guide with source links, prompts, and a matching cover.
- `_posts/2026-08-25-top-10-soft-skills-in-tech-companies.md`: English explanatory article.
- `_posts/2026-08-29-simple-captcha-with-nodejs.md`: Persian tutorial with executable examples and stated limitations.
- `_posts/2026-10-10-finite-state-machine.md`: Persian series installment with related-post links.

Check `_config.yml`, `_layouts/post.html`, `_includes/post-image.html`, and `_includes/blog.html` when their behavior matters. Reuse the site's templates and image pipeline; a new post normally needs no layout, index, sitemap, or styling edits. The blog lists and sitemap discover posts automatically.

## Article file and metadata

Use `_posts/YYYY-MM-DD-descriptive-kebab-case-slug.md`. Use the user's requested date, otherwise their current local date. Keep the filename date and front matter consistent. Avoid accidental future dates, which may keep a post out of the build.

New English posts should explicitly declare `lang: en` and `direction: ltr`, even though older English posts omit them. For Persian, use `lang: fa`, `direction: rtl`, and an accurately converted Persian `date_label` when following that convention. Do not guess a calendar conversion. Honor the requested language; otherwise use the language of the requested article or ask if it materially matters.

Adapt this front matter, replacing the example values:

```yaml
---
layout: post
title: "How to Build Good Apps with AI"
date: 2026-10-25
lang: en
direction: ltr
description: "A practical guide to building reliable apps with AI through clear requirements, small changes, and real feedback."
excerpt: "AI speeds up implementation. Clear requirements and real checks turn a working demo into a useful application."
image: /assets/images/posts/building-good-apps-with-ai.jpg
image_alt: "An AI processor assembles task cards into an app beside a glowing validation shield."
---
```

Write a specific description and a short standalone excerpt in the article's language. Describe the actual cover in `image_alt`. Use site-root image URLs. Quote YAML strings containing punctuation that could change parsing.

The layout already supplies the title as H1, author, date, hero, and back link. Start the body with prose and use H2/H3 for sections; do not duplicate the title or hero in the body.

## Writing and research

- Open with a recognizable problem and explain what the reader will learn or achieve.
- Write direct, natural prose with concrete examples. Match the depth to the topic; do not impose a fixed section count or word count.
- For tutorials, explain the decisions behind the code, provide the steps needed to run it, and include meaningful checks and relevant limitations. Use language-tagged fenced code blocks and the site's existing build-time syntax highlighting.
- For conceptual articles, use a running example, useful comparisons, or a practical workflow where they improve understanding. Avoid padding, unsupported superlatives, and invented personal experience or benchmarks.
- Read user-provided sources before describing them. Link each factual project claim to its supporting source near the claim. Distinguish documented capabilities, your proposed use, and hands-on verification. Do not imply that reading a README means you tested the tool.
- Follow the repository's Context7 instructions for library, framework, SDK, API, CLI, or cloud-service documentation. Verify version-sensitive syntax against the relevant version. General engineering prose does not need unnecessary API lookups.
- Link related existing posts when useful. Their URL convention is `/blog/YYYY/MM/DD/slug/`; verify the target file exists. Preserve series continuity when writing an installment.

## A dedicated cover for each new post

Include a topic-specific cover as part of the normal new-post deliverable unless the user explicitly requests text only or postpones artwork. A placeholder is temporary and should be reported as unfinished.

Load the available imagegen skill and use the built-in image generation tool. Inspect at least two existing covers before generating, using them as style references rather than edit targets. Useful references in `assets/images/posts/`:

- `hello-world.jpg`: dark workbench, charcoal materials, cyan light, restrained geometric detail.
- `my-secretary-task-manager.jpg`: tactile dark interface cards, teal and amber accents.
- `finite-state-machine.jpg`: precise 3D software metaphor with cyan connections and amber emphasis.
- `building-good-apps-with-ai.jpg`: matching app-building scene with assembly and validation.

Prefer references closest to the topic. The recurring visual direction is a polished dark 3D editorial illustration: black or charcoal surfaces, subtle grids, controlled cyan/teal lighting, small warm amber accents, soft shadows, and a clear focal subject. Use a metaphor specific to the article; do not repeat the AI processor or task cards for unrelated subjects. Avoid generic robot imagery, excessive neon, watermarks, logos, and generated text unless the user requests them.

Prompt shape:

> Create a new 3:2 blog cover, ideally 1536×1024. The attached existing covers are style references only. Depict [the article's central concept as a concrete scene]. Match their dark charcoal 3D materials, restrained cyan/teal and amber accents, subtle grid details, atmospheric lighting, and spacious composition. Keep important objects within the frame and readable at thumbnail size. No text, logos, or watermark.

Inspect the result for topic relevance, style, crop, and thumbnail legibility. Generate first, then copy or convert the chosen output into the repository; do not leave a project image reference pointing into an agent's generated-image directory. Preserve existing covers unless replacement was requested.

### Exact files and dimensions

Use a stable descriptive image stem, normally matching the article slug:

| File | Dimensions |
| --- | --- |
| `assets/images/posts/<stem>.jpg` | 1536 × 1024 |
| `assets/images/posts/<stem>-384.webp` | 384 × 256 |
| `assets/images/posts/<stem>-768.webp` | 768 × 512 |
| `assets/images/posts/<stem>-1536.webp` | 1536 × 1024 |

Generate at 3:2. If needed, crop deliberately and resize while preserving proportions; do not stretch the image. Save an optimized RGB JPEG fallback (quality around 90 matches the current cover workflow). The layout hardcodes 1536×1024 intrinsic dimensions, so verify the final JPEG matches.

Use `scripts/optimize-images.py` for the existing responsive pipeline when processing all post JPEGs is intended. It requires `cwebp` and rewrites variants for every JPEG. For one new cover, avoid unrelated binary changes by applying the same settings to that cover only, once per width 384, 768, and 1536:

```sh
cwebp -quiet -q 82 -resize 384 0 -metadata none assets/images/posts/<stem>.jpg -o assets/images/posts/<stem>-384.webp
```

Replace `<stem>` and the width/output suffix for each invocation. Verify all three WebP files decode, have the expected dimensions, and are smaller than the JPEG. The shared include discovers variants by stem; front matter must reference the `.jpg` fallback.

## Verify and deliver

Check front matter parses, language and direction agree, filename and metadata dates match, local links and images exist, and code fences are balanced. Review the article for unsupported claims and leftover example values. Run executable examples when included and practical; report anything not executed.

Run `git diff --check`. When the local bundle is available, build to a temporary output directory and use the existing site checker:

```sh
bundle exec jekyll build --destination /tmp/github-profile-post-preview
python3 scripts/check-seo.py /tmp/github-profile-post-preview
```

Check the rendered article and blog thumbnail when a preview is available. If a missing dependency blocks the build, report it accurately and complete the independent metadata and image checks; do not claim a successful build or install dependencies just to change unrelated configuration.

Deliver links to the article and cover, the dimensions and responsive variants, and a short account of verification and remaining limitations. When generating artwork, also report the tool used and the final prompt or a link to a saved prompt. Keep changes focused on the article and its assets.
