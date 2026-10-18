# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

pilatesegitmeni.com is an independent Pilates information and editorial brand. It is **not** a personal instructor website: don't write copy, pages or metadata that present it as one person's teaching business.

- Goals: publish trustworthy Pilates information and grow the brand's Instagram community.
- Languages: Turkish and English.
- Visual identity: premium, minimalist.
- Repository: https://github.com/arfdrgc/pilatesegitmeni.github.io

## Working rules

- Ask before building any design or website feature. Propose it first and build only after approval.
- Never install dependencies, scaffold the project, commit, push or deploy without explicit approval for that specific action.
- Never invent authors, reviewers, credentials, content sources, or health/medical claims. If content needs one and none was provided, leave a visible TODO and ask.
- Keep the site lightweight and maintainable: static output, few dependencies, and no client-side JavaScript unless a feature needs it.

## Technical decisions

- Astro with TypeScript (strict) and plain CSS. No CSS or UI framework.
- Articles are Markdown files in Astro content collections, validated by a frontmatter schema.
- Turkish is the default language and lives at the root (`/`); English lives under `/en/` (Astro i18n with `prefixDefaultLocale: false`).
- No analytics, cookies or third-party tracking scripts for now.
- Instagram: the handle stays an explicit TODO until the real account is provided. Don't guess one. Use plain links, not embedded feeds.
- Final domain: pilatesegitmeni.com, set once as Astro's `site`. Canonical URLs always use it.
- Portability: the build must be plain static files that work on any static host. Assume the site is served from the domain root: don't set Astro's `base` or hard-code a GitHub Pages subpath (`/pilatesegitmeni.github.io/`).
- Hosting: GitHub Pages via GitHub Actions (`.github/workflows/deploy.yml`), but nothing is deployed yet; see "Deployment status" below. Don't assume DNS is configured. Development uses local preview only (`astro dev` / `astro preview`).

## Deployment status (as of 2026-10-19)

- Commit `ea9ab2d85746d42312568aef64bee04488e08fbb` ("Add manual GitHub Pages deployment workflow") is pushed to `origin/main`.
- `.github/workflows/deploy.yml` triggers only on `workflow_dispatch` (no push trigger). It runs `npm ci` and `npm run build` (so `check-dist` gates the deploy), uploads `dist/` and deploys with `actions/deploy-pages`. It has never run. **The site has NOT been deployed.**
- No GitHub settings or DNS records have been changed. DNS is at GoDaddy (`ns49`/`ns50.domaincontrol.com`); `@` and `www` still point to `92.205.6.33`.
- Until this repo has its own custom domain, Pages would serve it under the user site's domain (`arifdurgec.com/pilatesegitmeni.github.io/`), where the root-relative asset paths break. Don't deploy before step 2.
- No `CNAME` file: GitHub ignores it for Actions deployments; the custom domain lives in the repository's Pages settings.

Next steps, in order (each GitHub/DNS change is done by the owner, not Claude):

1. Verify `pilatesegitmeni.com` in GitHub profile Settings → Pages, using the unique TXT record GitHub provides. Add it in GoDaddy as `_github-pages-challenge-arfdrgc`.
2. In repository Settings → Pages, select `GitHub Actions` as the source and set the custom domain to `pilatesegitmeni.com`.
3. Update GoDaddy DNS:
   - A `@` → `185.199.108.153`
   - A `@` → `185.199.109.153`
   - A `@` → `185.199.110.153`
   - A `@` → `185.199.111.153`
   - AAAA `@` → `2606:50c0:8000::153`
   - AAAA `@` → `2606:50c0:8001::153`
   - AAAA `@` → `2606:50c0:8002::153`
   - AAAA `@` → `2606:50c0:8003::153`
   - Change CNAME `www` to `arfdrgc.github.io`.
   - Delete the old A `@` record pointing to `92.205.6.33`.
4. Preserve all email records, including MX `@` → `mail.pilatesegitmeni.com`, A `mail` → `92.205.6.33`, SPF TXT `@` → `v=spf1 a mx ptr include:secureserver.net ~all`, and every other email-related record.
5. Wait for GitHub's DNS check and HTTPS certificate, then enable Enforce HTTPS.
6. Run the manual deployment workflow ONLY after the owner explicitly confirms the site is ready to publish.

## Commands

- `npm run dev`: local dev server (http://localhost:4321). Shows dev-only TODO placeholders, drafts and sample articles.
- `npm run build`: production build, then `scripts/check-dist.mjs`. The build fails if the output contains:
  - dev placeholders, draft/sample articles, sample fixtures, any image from `src/content/samples/`, or `sample-placeholder*` images;
  - placeholder or localhost links, or unapproved Instagram links;
  - images without `alt`, `width` or `height`, or with generic or file-name alt text (`alt=""` is allowed for decorative images);
  - canonical, hreflang or sitemap URLs that don't resolve to a built page.
- `npm run preview`: serve the production build locally.
- `npm run check`: `astro check` (types), then `scripts/check-contrast.mjs` (approved palette and WCAG contrast in both themes).

Astro 7 runs `astro dev`/`astro preview` as background processes; stop them with `npx astro dev stop` / `npx astro preview stop`. `npm run check` and `npm run build` can run while the dev server is up: they go through `scripts/keep-dev-imports.mjs`, which restores the dev server's content import maps in `.astro/` afterwards (running `npx astro check`/`build` directly skips this, and the dev server then needs a restart to show sample images). Dependencies are exact-pinned. TypeScript must stay on 6.x: `astro check` and `@astrojs/check` don't support TypeScript 7.

## Architecture

- **i18n:** Turkish pages live in `src/pages/`, English pages in `src/pages/en/`. Interface strings are in `src/i18n/ui.ts`; path helpers (`homePath`, `articlePath`, `languageSwitchPath`) are in `src/i18n/utils.ts`. Article URLs are `/yazilar/<slug>/` (TR) and `/en/articles/<slug>/` (EN).
- **Translations:** every page passes `translations` to `BaseLayout`: the paths of all *built* language versions, including itself. This single value drives the language link (it falls back to the other language's homepage) and the hreflang tags in `SeoHead.astro` (emitted only when a real translation exists). The sitemap deliberately has no i18n option, because it would pair pages by identical paths, which misses translated slugs.
- **Articles:** Markdown in `src/content/articles/{tr,en}/`, schema in `src/content.config.ts` (strict: unknown frontmatter keys fail). The folder sets the language and the file name sets the slug (lowercase ASCII with hyphens). Pages must read articles only through `getPublishedArticles()` in `src/lib/articles.ts`, which drops `draft: true` and `sample: true` entries in production.
- **Sample fixtures:** layout-preview content lives only in `src/content/samples/{tr,en}/`, with its images in `src/content/samples/images/` (named `sample-placeholder-*`). It is never publishable content.
  - `content.config.ts` loads `samples/` only under `astro dev`, so a production build never loads the fixtures or their images. This matters because Astro emits every image referenced by a loaded entry into `dist/`, even if no page renders it.
  - `getPublishedArticles()` stops with an error if a file in `samples/` lacks `sample: true`, or if a file in `articles/` sets it. Never put sample files or images in `src/content/articles/`.
  - Sample file names must not reuse a real article's slug: `check-dist` treats every sample slug and title as forbidden in production output.
  - Fixtures use obvious filler text (pangrams, "Örnek içerik" / "Sample content"), never invented Pilates content, sources or credits.
- **Categories:** labels come from `src/config/categories.json` (`{ "key": { "tr": …, "en": … } }`), which stays empty until categories are approved. `categoryLabel()` in `src/lib/categories.ts` shows a placeholder in dev and stops a production build for any unapproved category.
- **Coming-soon page (temporary):** `/` and `/en/` currently render `src/components/ComingSoon.astro`, with copy and meta descriptions in `src/config/coming-soon.json`. The original homepage below is unchanged and previewable only under `astro dev` at `/dev/home/` and `/en/dev/home/`: the `dev-home-preview` integration in `astro.config.mjs` injects `src/dev/HomePreview.astro` for `astro dev` only, so a build never compiles it, and `check-dist` fails on any built `dev/` or `en/dev/` file. To restore the homepage, point both `index.astro` pages back at `HomePage` (as `HomePreview.astro` does) and delete the coming-soon component and config, `src/dev/`, the integration, the `sage on bg` pair in `check-contrast.mjs` and this note.
- **Homepage:** `src/components/home/HomePage.astro` is shared by `/` and `/en/` (see the coming-soon note above), with sections in the order intro, featured article (newest), latest list (up to 6), Instagram band. Topics are deferred until categories and topic pages are approved.
  - Brand copy slots live in `src/config/home.json`. `null` means the content is left out in production and shown as a TODO in dev; never fall back to the other language's text.
  - A section with no real content is not rendered at all in production: no empty sections, no "coming soon".
- **Navigation:** header and footer items, and the articles index link, live in `src/config/navigation.ts`. Add an item only once its page exists in both languages.
- **Dev-only placeholders:** render TODOs only through `src/components/DevPlaceholder.astro`. Anything else dev-only (draft badges, the dev note, the Instagram band without a handle) must carry `data-dev-only`, which is what `check-dist` looks for. Sample cards carry `data-sample`.
- **Instagram:** `src/config/brand.json` holds `instagramHandle` (currently `null`). While it's null, no Instagram link renders in production. Once set, it is the only Instagram URL `check-dist` allows.
- **Styling:** plain CSS. All colours are `--color-*` tokens in `src/styles/tokens.css` (light `:root`, plus a `prefers-color-scheme: dark` block; there is no manual theme toggle). `check-contrast.mjs` holds the approved palette and rejects any colour defined elsewhere, so changing a colour means updating both files after approval. The `theme-color` metas in `SeoHead.astro` must match `--color-bg`.
- **Fonts:** self-hosted Newsreader (editorial text) and Inter (navigation, dates, labels) WOFF2 files in `public/fonts/`, copied from `@fontsource-variable/*@5.3.0`, each with its OFL licence. Fontsource is deliberately not a dependency. Turkish text needs both the latin and latin-ext files. Common ligatures are off for `:lang(tr)` because Newsreader's "fi" ligature hides the i/ı distinction.
- **Domain:** `site` in `astro.config.mjs` is the only place the domain appears. Never set `base`.
