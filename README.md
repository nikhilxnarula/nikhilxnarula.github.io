Mail me interesting opportunities at nikhilxnarula@gmail.com

This repo is my website, [nikhilxnarula.github.io](https://nikhilxnarula.github.io). GitHub Pages builds it with Jekyll on every push to `main`.

## Add a post

Create `_posts/YYYY-MM-DD-title.md`:

```markdown
---
title: The Post Title
kicker: Building · MCP
description: One or two sentences for the writing page and link previews.
---

Write in Markdown from here. Use `##` for section headings.
```

The file name sets the URL and the date. The post then appears on the writing page and in the RSS feed, and the newest post also appears on the home page.

## Change something

| What | Where |
| --- | --- |
| Email, GitHub and LinkedIn links | `_config.yml` |
| Home page text | `index.html` |
| Contact page | `contact/index.html` |
| Colours and type | the tokens at the top of `assets/css/site.css` |

## Preview locally (optional)

This needs Ruby. Pushing to `main` needs nothing.

```bash
bundle install
bundle exec jekyll serve
```

The fonts are [Bricolage Grotesque](https://github.com/ateliertriay/bricolage) and [JetBrains Mono](https://github.com/JetBrains/JetBrainsMono), under the SIL Open Font License (see `assets/fonts`).
