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
- Instagram: the owner's account is `@pilatesegitmeni` (set 2026-10-21). Use plain links, not embedded feeds.
- Final domain: pilatesegitmeni.com, set once as Astro's `site`. Canonical URLs always use it.
- Portability: the build must be plain static files that work on any static host. Assume the site is served from the domain root: don't set Astro's `base` or hard-code a GitHub Pages subpath (`/pilatesegitmeni.github.io/`).
- Hosting: GitHub Pages via GitHub Actions (`.github/workflows/deploy.yml`), deployed by hand by the owner; see "Deployment status" below. The apex domain is live; `www` and the HTTPS redirect are not set up yet. Development uses local preview only (`astro dev` / `astro preview`).

## Deployment status (as of 2026-10-23)

- The coming-soon release is live at https://pilatesegitmeni.com/: the TR/EN coming-soon pages, the bilingual 404, the A · Open logo lockup, the favicon, the Instagram footer link and the light-only palette. The posture prototype and intro ritual are not part of it and stay uncommitted.
- `.github/workflows/deploy.yml` triggers only on `workflow_dispatch` (no push trigger). It runs `npm ci` and `npm run build` (so `check-dist` gates the deploy), uploads `dist/` and deploys with `actions/deploy-pages`. The owner starts every run; Claude never starts, re-runs or triggers it.
- **Not deployed:** since `dbd5fe4` the homepage intro with the dot figure on `/` and `/en/` was built (2026-10-25), including its opening scene, the 2026-10-26 animation revision, its corrections and the Replay change, with its dev prototypes and the earlier ritual work. It is all uncommitted, unpushed and undeployed. See "Dot figure in the homepage intro".
- Runs (UTC): #1 `f61f02d` failed; #2 `c3328ac` succeeded 2026-10-22 11:37 (lockup on `/` and `/en/`); #3 `4053c3d` succeeded 2026-10-22 21:15 (favicon); #4 `dbd5fe4` succeeded 2026-10-23 08:37 (lockup on the 404 page). The live site is `dbd5fe4`.
- Checked live on 2026-10-23: `/`, `/en/`, `robots.txt`, `sitemap-index.xml`, `/favicon.svg` and `/favicon.ico` return 200, and both favicon files are byte-identical to `public/`. A missing URL, also under `/en/`, returns status 404 with the bilingual 404 page, whose header and footer show the Turkish primary lockup (checked in Chrome).
- DNS (GoDaddy, `ns49`/`ns50.domaincontrol.com`), as observed on 2026-10-21: A `@` → `185.199.108.153`, `.109.153`, `.110.153`, `.111.153` (GitHub Pages); no AAAA records; CNAME `www` → `pilatesegitmeni.com`. Email records are intact: MX `@` → `mail.pilatesegitmeni.com`, A `mail` → `92.205.6.33`, SPF TXT `@` → `v=spf1 a mx ptr include:secureserver.net ~all`.
- HTTPS: the apex has a Let's Encrypt certificate (issued 2026-10-19). As of 2026-10-23, `http://pilatesegitmeni.com/` still answers without redirecting to `https://`, and `https://www.pilatesegitmeni.com/` still fails certificate verification (on 2026-10-21 its certificate was `*.github.io`).
- Not verified (no `gh` CLI): the Pages source and Enforce HTTPS settings. The successful `actions/deploy-pages` runs suggest the source is `GitHub Actions`, but Settings was not checked.
- No `CNAME` file: GitHub ignores it for Actions deployments; the custom domain lives in the repository's Pages settings.

Remaining steps, in order (each GitHub/DNS change is done by the owner, not Claude):

1. Enable Enforce HTTPS once GitHub offers it.
2. Change CNAME `www` to `arfdrgc.github.io` in GoDaddy, so GitHub issues a certificate covering `www` and redirects it to the apex. Optionally add AAAA `@` → `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`.
3. Preserve all email records listed above, and every other email-related record.
4. Check the favicon in real browser tabs (see Favicon below).

For each later release, the owner starts a new run on `main` once they have confirmed it is ready, then checks the affected live pages.

## Commands

- `npm run dev`: local dev server (http://localhost:4321). Shows dev-only TODO placeholders, drafts and sample articles.
- `npm run build`: production build, then `scripts/check-dist.mjs`. The build fails if the output contains:
  - dev placeholders, draft/sample articles, sample fixtures, any image from `src/content/samples/`, or `sample-placeholder*` images;
  - placeholder or localhost links, or unapproved Instagram links;
  - images without `alt`, `width` or `height`, or with generic or file-name alt text (`alt=""` is allowed for decorative images);
  - canonical, hreflang or sitemap URLs that don't resolve to a built page.
- `npm run preview`: serve the production build locally.
- `npm run check`: `astro check` (types), then `scripts/check-contrast.mjs` (approved light palette and WCAG contrast).

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
- **Coming-soon page (temporary):** `/` and `/en/` currently render `src/components/ComingSoon.astro`, with copy and meta descriptions in `src/config/coming-soon.json`. Since plan step 10 (2026-10-25, uncommitted, not deployed) it shows the homepage intro with the dot figure instead of the two-character welcome ritual; see "Homepage integration (plan step 10)" below. The welcome ritual was never deployed: the live site (`HEAD`) still shows the plain coming-soon label and title until this is committed and deployed. The original homepage below is unchanged and previewable only under `astro dev` at `/dev/home/` and `/en/dev/home/`: the `dev-home-preview` integration in `astro.config.mjs` injects `src/dev/HomePreview.astro` for `astro dev` only, so a build never compiles it, and `check-dist` fails on any built `dev/` or `en/dev/` file. To restore the homepage, point both `index.astro` pages back at `HomePage` (as `HomePreview.astro` does) and delete the coming-soon component and config, `src/dev/`, the integration, the `sage on bg` pair in `check-contrast.mjs` and this note.
- **Homepage menu and pose loop (uncommitted, not deployed, as of 2026-10-31):** this supersedes the one-item menu and the "next task" under "Dot figure in the homepage intro". After the intro, `/` and `/en/` show the six-item ring menu (`src/config/home-menu.ts`, `src/prototypes/home-intro/SixItemMenu.astro`), and `homepage.ts` plays `createLoopScene` from `src/prototypes/home-intro/loopScene.ts`. Its `POSES`, in order: IDLE, Hundred (Miras), Hanging Pull-Up (Repertuar), Swan (İlham), Teaser (Bedenin Dili), Ladder Barrel (Contrology), Up Stretch (7 Prensip); 28 000 ms a cycle. **`src/prototypes/home-intro/` is not dev-only: production imports it, and it is untracked, so it must be committed with the homepage.** Its `/dev/` routes stay out of `dist`. The full record is in `../SESSION-HANDOFF-2026-10-23-homepage-intro-storyboard.md`, last section.
- **Homepage:** `src/components/home/HomePage.astro` is shared by `/` and `/en/` (see the coming-soon note above), with sections in the order intro, featured article (newest), latest list (up to 6), Instagram band. Topics are deferred until categories and topic pages are approved.
  - Brand copy slots live in `src/config/home.json`. `null` means the content is left out in production and shown as a TODO in dev; never fall back to the other language's text.
  - A section with no real content is not rendered at all in production: no empty sections, no "coming soon".
- **404 page:** `src/pages/404.astro` (content in `src/components/NotFound.astro`) builds `dist/404.html`. GitHub Pages serves only that file for every missing URL, `/en/` included, so it is one bilingual page: `<html lang="tr">`, Turkish first, then an English block with `lang="en"`, each linking to its own homepage. There is no script that picks the language from the URL. Don't add `src/pages/en/404.astro`: Pages never serves it, and `check-dist` would fail it for having no canonical link and no sitemap entry. The page passes `notFound` and empty `translations` to `BaseLayout`, so `SeoHead.astro` emits `noindex` and no canonical, hreflang or `og:url`. The sitemap integration leaves 404 pages out on its own. Since `dbd5fe4` (live since deployment run #4, 2026-10-23) it also passes `lockup`, so its header and footer show the Turkish primary lockup, as on `/`. The page is `lang="tr"`, so the English block also sits under the Turkish lockup.
- **Navigation:** header and footer items, and the articles index link, live in `src/config/navigation.ts`. Add an item only once its page exists in both languages.
- **Dev-only placeholders:** render TODOs only through `src/components/DevPlaceholder.astro`. Anything else dev-only (draft badges, the dev note, the Instagram band without a handle) must carry `data-dev-only`, which is what `check-dist` looks for. Sample cards carry `data-sample`.
- **Instagram:** `src/config/brand.json` holds `instagramHandle` (`"pilatesegitmeni"` since 2026-10-21; while it is `null`, no Instagram link renders in production). It is the only Instagram URL `check-dist` allows, `https://www.instagram.com/pilatesegitmeni/`. `InstagramLink.astro` renders it as a text link (Instagram band) or, with `showHandle`, as an inline-SVG Instagram glyph plus `@pilatesegitmeni` with the accessible name "Instagram: @pilatesegitmeni" (footer). The header has no Instagram link (owner's decision, 2026-10-21). There is no icon library; the glyph is drawn in the component. Links open in the same tab, like every other link on the site.
- **Styling:** plain CSS. The site is light-only by design: no dark mode, no `prefers-color-scheme` styles and no theme toggle. All colours are `--color-*` tokens in the single `:root` block of `src/styles/tokens.css`, which sets `color-scheme: only light` so browsers don't apply automatic dark modes. `check-contrast.mjs` holds the approved palette, fails if a dark block reappears, and rejects any colour defined elsewhere, so changing a colour means updating both files after approval. The single `theme-color` meta in `SeoHead.astro` (no `media` attribute) must match `--color-bg`.
- **Fonts:** self-hosted Newsreader (editorial text) and Inter (navigation, dates, labels) WOFF2 files in `public/fonts/`, copied from `@fontsource-variable/*@5.3.0`, each with its OFL licence. Fontsource is deliberately not a dependency. Turkish text needs both the latin and latin-ext files. Common ligatures are off for `:lang(tr)` because Newsreader's "fi" ligature hides the i/ı distinction.
- **Logo:** every production page (`/`, `/en/` and the 404 page) shows the approved A · Open primary lockup through `BaseLayout`'s `lockup` prop and `src/components/LogoLockup.astro`: Turkish on `/` and the 404 page, English on `/en/`. The SVGs in `src/assets/logo-a-open/` are byte copies of `../brand-assets/logo/original/lockups/lockup-primary-{tr,en}.svg`. They have been live since deployment runs #2 (`c3328ac`, coming-soon pages, 2026-10-22) and #4 (`dbd5fe4`, 404 page, 2026-10-23). Without `lockup`, the header and footer fall back to `Logo.astro`. Only the dev-only homepage preview (`/dev/home/`, `/en/dev/home/`) uses that fallback now, but the build still emits one unreferenced `logo-wordmark.*.png` because the header and footer import it. The fallback is `src/assets/logo-wordmark.png`, the owner's wide "Pilates Eğitmeni" wordmark (an unmodified copy of `../reference_assets/logo_book_v2_transparent.png`, 916 × 400 RGBA PNG with a real transparent background; since 2026-10-21). `src/components/Logo.astro` renders it through `astro:assets` as PNG (alpha kept) at 384/640/916 px with `srcset`/`sizes` and the intrinsic `width`/`height`, so its space is reserved before it loads. Alt text is `logoAlt` in `src/i18n/ui.ts` ("Pilates Eğitmeni logosu" / "Pilates Eğitmeni logo"). The artwork carries the name, so the header (home link) and footer show the logo alone. Their widths are the earlier JPEG's `clamp()` values (header `12rem` → `18rem`, footer `13rem` → `20rem`) multiplied by 916/1024, so the artwork, whose side margins are narrower in this file, renders at the same size as before (about 10.73 → 16.1rem and 11.63 → 17.89rem, with matching `sizes` hints). They show it with no name text, straight on `--color-bg` and `--color-surface`. The PNG's semi-transparent edge pixels are light (matted from white), which is invisible on these light grounds but would show as a pale fringe on a dark one such as `--color-band`. To update the logo, replace that file under the same name. The earlier opaque JPEG (`src/assets/logo.jpg`, a copy of `../reference_assets/logo_book_v1_wide.jpg`) was removed once unreferenced; the original stays in `reference_assets/`. The previous "P" monogram, `src/assets/logo.png`, is no longer referenced (so not built) and was left in place as the only copy. There is no `og:image`; the favicon is described below. The prototype pages keep their own text header.
- **Favicon** (concept A, approved by the owner on 2026-10-22): committed as `4053c3d` and **live since deployment run #3** (2026-10-22 21:15 UTC). On 2026-10-23 the live `/favicon.svg` and `/favicon.ico` were verified byte-identical to the files below. That confirms the files are deployed, not how the icon looks in a tab: see "Not tested".
  - `public/favicon.svg` is the adaptive SVG favicon. It holds the approved compact symbol (Spine Green, for light themes) and the approved reverse compact symbol (Paper, for dark themes), both unchanged, and switches between them with a single `prefers-color-scheme: dark` rule. The dark group also has `display="none"`, so a renderer that ignores the rule shows the light symbol. The rule only changes the icon in the browser tab, not any page style, so the site itself stays light-only (see Styling).
  - `public/favicon.ico` is the light-only compatibility fallback (16, 24, 32 and 48 px frames) for browsers that don't use SVG favicons.
  - Both are byte-identical copies of the approved sources in the brand library: `../brand-assets/logo/icon/favicon-draft/favicon-draft-adaptive.svg` and `favicon-draft.ico` (the folder keeps its earlier "draft" name). The library is the source of truth: change the favicon there, then copy the files again under the same names. Don't edit the copies here.
  - The links are in `src/components/SeoHead.astro`, after the `theme-color` meta, with root-relative paths (no `base`): `<link rel="icon" href="/favicon.ico" sizes="32x32" />`, then `<link rel="icon" href="/favicon.svg" type="image/svg+xml" />`. `sizes="32x32"` is the commonly recommended way to keep Chrome from choosing the ICO over the SVG. Every page, including the 404 page, gets them through `BaseLayout`, and `check-dist` fails the build if either file is missing from `dist/`.
  - Not tested: the icon in real browser tabs, in any browser (Chrome, Firefox, Safari; light and dark tab themes), including how it reads at 16 px. Only Chrome's renderer was checked, in the brand library: the adaptive file draws as the light file under a light scheme and as the dark file under a dark one.
  - Known limits:
    - At 16 px on standard-resolution screens the symbol reads as a cross in a ring.
    - The ICO is light only.
    - The switch follows the browser's colour scheme, not the tab's actual colour.
    - Browsers cache favicons aggressively.
- **Domain:** `site` in `astro.config.mjs` is the only place the domain appears. Never set `base`.

## Dot figure in the homepage intro (2026-10-25, uncommitted)

*Timing superseded (2026-10-31): the intro times in this section are history. Arif approved the current timing on 2026-10-31: the scene now ends at 25 848 ms with the six menu items, and arm raising starts at 8885. The authoritative table is in `../SESSION-HANDOFF-2026-10-23-homepage-intro-storyboard.md`, last section, "APPROVED INTRO TIMING 2026-10-31 (authoritative)".*

**Status (2026-10-26, end of session; start here after `/clear`):**

- **Current state:** the homepage intro animation is complete. The dot-figure intro plays on `/` and `/en/`, and on the dev previews `/dev/home-intro/` and `/en/dev/home-intro/`. All of it shares `HomeIntro.astro` and `dotScene.ts`; the scene is 29 990 ms.
  - **What it does:** it opens from a single dot. Then come the title over the held hunch, the straightening, the 45° reach (the hand on the crown at scene 14 610 ms, at full length at 17 000), and a breath in and a 3 s breath out. The motto comes in as she turns to the front, then the Instagram item, then Replay.
  - **The circle:** it rests on the line and changes size with her pose. Through the reach it follows the arm (`frameReach`: 0.816 standing → about 0.95 on the crown → 0.994 at the top → 0.816). The breath widens it 12% in time with the body (`RING_BREATH`).
  - **Replay:** "Yeniden izle" / "Replay" replaces the coming-soon line under the motto; the stop control shows while the intro plays.
  - Details are in the last notes of this section: "Visual corrections (2026-10-26, after review)", "Reach correction", "Circle update" and "Replay in the coming-soon line's place". The owner visually reviewed and approved all of them on 2026-10-26.
- **Next task (owner):** add the menu steps. The menu today has one real item, Instagram at 5 o'clock, revealed together with its dot once she reaches the front view (`REVEAL_AT = IDLE_AT`, 26 440 intro ms, `dotScene.ts`).
  - Items come from the `items` array in `HomeIntro.astro`, placed with `ringPoint(hour)` from `geometry.ts`, and are staggered 150 ms apart.
  - An item at 9 or 3 o'clock switches the phones to tier B (`sideLabels`).
  - Ask the owner for the steps' names, targets and positions before building.
- **Earlier work, approved by the owner after visual review (2026-10-26):** the targeted corrections after the owner's visual feedback (2026-10-26): knees on the line, a ring sized to her pose, the cues close under the line, a new reach, a breath with the whole upper body. See "Visual corrections (2026-10-26, after review)" at the end of this section; it supersedes that section's framing (`FIXED`, `DROP`, the moving line), reach poses and breath. Before it: the ordered animation revision (phases 1–5), built and verified on 2026-10-26; see "Animation revision (2026-10-26)". It supersedes parts of "Opening scene" below: the roll-down, the waist-up opening and its pull-back, the chin cue, the slogan's hold-and-go, the line closing, and the menu dot riding out on the ring are gone. The scene is **29 990 ms** (was 32 800).
- **Superseded, not done:** the 2026-10-25 "next task" (keep the Instagram dot above the line in the opening). Phase 1 hides the menu's dots until the reveal, so there is no dot in the opening any more.
- **Nothing is committed, pushed or deployed** (as of the end of 2026-10-26): all of this work is uncommitted working-tree changes and untracked files, and the live site is still `dbd5fe4` and unchanged. Preserve them; don't revert, reset or stash.
- **Homepage script:** 79 795 → 18 896 B raw, and 30 919 → 8 603 B with `gzip -9`, after the old characters' artwork and the old intro's timing helpers came out. With the opening scene: 20 589 / 9 349 B. After the 2026-10-26 revision: 21 183 B raw, 9 565 B `gzip -9`; after the visual corrections: 22 297 B raw, 10 067 B `gzip -9`; after the reach correction and the circle update: 23 371 B raw, 10 482 B `gzip -9`; after Replay replaced the coming-soon line: **23 223 B raw, 10 429 B `gzip -9`** (not optimised, as instructed).
- **Left in on purpose:** about 1.7 KB rendered of character proportion constants (`ritual/proportions.ts` through `geometry.ts`). Option C, moving the ring constants into their own module, was investigated and **declined by the owner**: the further saving (−197 B gzipped) is small for the structural change. Don't pursue it unless asked.
- **Latest checks** (2026-10-26, current tree, after the Replay change): `npm run check` 0 errors, 0 warnings, 0 hints and 17/17 contrast pairs. `npm run build` passes with `check-dist` clean (`/`, `/en/`, `/404.html`), and the dev-only, old-ritual and coming-soon greps on `dist` find nothing. Browser checks are listed in "Replay in the coming-soon line's place" and "Visual corrections (2026-10-26, after review)".
- **Still open:**
  - the copy questions listed under "Animation revision (2026-10-26)" (the English cue drafts, the crown cue's wording, the motto's capitalisation);
  - the empty "Keşfet" landmark during the intro;
  - unreviewed labels;
  - no VoiceOver check, no real devices, no Safari or Firefox.

The approved abstract dot figure replaces the female character in the homepage intro. It was built and reviewed on the development preview, `/dev/home-intro/` (Turkish) and `/en/dev/home-intro/` (English), kept in sync, which stays the reference. Since plan step 10 (on the owner's instruction, 2026-10-25) the same intro is on `/` and `/en/`; see "Homepage integration (plan step 10)" at the end of this section. A first attempt earlier on 2026-10-25 put the figure on `/` by mistake, inside the welcome ritual; it was reverted, and every `ritual/` file and `config/ritual.ts` was SHA-1 checked identical to before. Step 10 leaves them untouched too. Nothing is committed, pushed or deployed.

**Approved by the owner (2026-10-25). Don't change without their instruction:**

- The figure as approved on `/dev/dot-figure/`, with its roll-down and return to standing.
- Settings: radius 1.0–4.0 px, Dense, Clay and Sage (`clay-sage`), spine highlight on, depth on, default fluidity 0.5.
- Viewing angle 70°; movement standing → roll-down → standing.
- The dots move unconnected. Sparse lines appear only once a pose has settled, and fade out before the next movement (the prototype's timing).
- The intro keeps its surrounding flow: the text, the menu's reveal, the stop control, Replay, and reduced-motion handling where they exist.

**Integration choices by Claude, awaiting the owner's review:**

- **Full-body opening** (*superseded on 2026-10-25 by the owner's opening scene; see "Opening scene" below*): she is full-body from the first frame, in the menu's framing (hair 4% of the ring's diameter below its top, soles as far above its bottom). She stands on the line, which is her floor (`DOT_FLOOR`, stage y 923) instead of the waist line.
  - A roll-down folds the torso below the waist, so the waist-up opening and its pull-back would hide it. There is no camera move.
- **The turn:** a real 3D turn from 70° to the front, timed like the prototype's view changes (`420 + 5 ms × degrees`, 770 ms, smoothstep). The lines clear before it and return after it settles. No wipe.
- **The idle:** the standing pose, arms hanging (as in the owner's 2026-10-24 revision). No hands-on-hips pose.
- **Timing:** the sentences are retimed to the dot movement (below); the copy is unchanged.
  - The breath and chin-tuck cues play over the still, settled standing pose: the figure has neither movement.

**Files:**

- `src/components/dot-figure/`: `model.ts`, `render.ts` and `palettes.ts`, moved from `src/prototypes/dot-figure/`, which now imports them from here.
  - `render.ts`'s `Stage.draw` takes an optional `Placement` (scale, axis x, floor y, as fractions of the canvas width). Without one it uses the prototype's framing.
  - `timeline.ts`: the dot intro as pure functions of time: `poseAt`, `lineAlphaAt`, `movingAt`, `sentenceTrack`, `sentenceOpacity`, `END`, `YAW`, `LOOK`, the prototype's line constants, `turnMs`, `smooth`.
- `src/components/home-intro/dotScene.ts`:
  - `createDotScene(root)`: the same `Scene` interface as `scene.ts`, with the same beats and copy after the intro: the slogan, the line closing, the turn, the menu's reveal, the slogan back, the coming-soon line, Replay in place of stop.
  - `drawStill(root, 'opening' | 'idle')` for the still frames.
  - The dense figure is sampled once per page (about 70 ms in Chrome) and shared by every frame. Each canvas redraws on resize, so hidden frames draw when shown.
- `src/components/home-intro/HomeIntro.astro`: a new prop `figure: 'character' | 'dots'` (default `character`). With `dots`:
  - a canvas `.intro__dots` (`data-dot-figure`, `aria-hidden`) is drawn over the stage;
  - no character, wipe or pose rules are emitted;
  - the line and the clip sit at `DOT_FLOOR`.
  - The ring, text, menu and controls markup are unchanged.
- `src/prototypes/home-intro/HomeIntroPreview.astro`: `FIGURE = 'dots'` sends that prop to every frame and picks `createDotScene` or `createScene`. Setting it to `'character'` shows the character version again; `scene.ts` and `geometry.ts` are unchanged.

**Timeline** (ms, 30 300 in total; *since the opening scene, below, every time here is 2500 ms later and the total is 32 800*):

- 0–1600: standing at 70°, lines in, title.
- Lines out by 1920.
- Roll-down 1920–7120; last dots 7255; lines in 7705–8605; hold.
- Lines out by 10 325.
- Return to standing 10 325–15 525; last dots 15 660; lines in 16 110–17 010.
- Sentences:
  - title 0 → 9325;
  - "straighten your back" 9875 → 12 575;
  - "reach up through the crown" 13 125 → 15 110;
  - "tuck the chin" 15 660 → 17 460;
  - the breath cue 18 010 → `END` 22 010, then fades out.
- Slogan in 22 560, out at 25 510, as the lines clear.
- Turn 25 830–26 600; the line closes 26 600–27 000; lines back in 27 050–27 950.
- Menu reveal 29 100; slogan back, coming-soon line and Replay up to 30 300.

**On the dev preview** (as with the character version):

- The preview plays the live frame from the start whenever it is shown. There is no once-per-tab logic on this dev page.
- The stop control and Replay are shown but do nothing; they are wired only on the homepage (plan step 10).
- With reduced motion it doesn't autoplay. The live frame then shows its first frame: standing at 70°, lines in, no text.

**Run** `npm run dev`:

- `/dev/home-intro/#live`: has dev controls for replay, pause, speed and scrubbing.
- `#opening` and `#idle`: the still frames.
- `/en/dev/home-intro/`: the same in English.
- `/dev/dot-figure/`: compare the figure's settings.

The dev routes never reach `dist` (`check-dist` rule 9). Since step 10 the intro itself is in `dist` (the homepage). After a build, `grep -rlE 'data-dev-|preview-bar|data-preview|createScene|HomeIntroPreview|DotFigure|/dev/|data-astro-source' dist` must find nothing.

**Verified (2026-10-25, Chrome on macOS):**

- `npm run check`: 0 errors, 0 warnings, 0 hints; 17/17 contrast pairs pass.
- `npm run build`: `check-dist` clean; the dev-only grep found nothing; `/` and `/en/` still rendered the two characters (before step 10).
- Desktop (1512 × 949 CSS px), scrubbed:
  - the opening, mid roll-down, rolled down, the return with the crown cue, the slogan;
  - just after the turn, with the line closed;
  - the final menu frame;
  - the `#opening` and `#idle` stills.
- Real-time playthrough (English): 30.3 s; rAF interval median 8.3 ms, maximum 10.4 ms; no console errors.
- Phone 390 × 844 (iframes, TR and EN): rolled down and the opening; no sideways scroll.
- Not checked: reduced motion in a browser, phone landscape, Safari, Firefox and real devices.

**Phone portrait layout (plan step 9, built 2026-10-25):**

The approved specification is in `../SESSION-HANDOFF-2026-10-23-homepage-intro-storyboard.md`, "phone portrait layout and the phone-landscape side column". The rules are CSS only, in `HomeIntro.astro`, under `@media (max-width: 47.99rem) and (orientation: portrait)`. They apply to the character and dot versions alike.

- **Ring, tier A** (no item at 9 or 3 o'clock; today only Instagram at 5): `--ring-phone` is the smallest of three values, never below 184 px:
  - 82% of the content width (`100vw − 2 × --gutter`);
  - `100svh − 18.5rem`;
  - 300 px.
- **Ring, tier B** (an item at 9 or 3): the content width less a 72 px label column on each side, also bounded by the height and at least 184 px.
  - The tier is chosen in the frontmatter from the items' hours (class `intro--side-labels`), so it changes only with the content.
- **The 18.5rem:** the header (107 px, measured at 375 px wide), the intro's top padding and two gaps (3rem), the text slot (6rem) and the controls (2.75rem). Everything above the footer fits 375 × 548; `svh` keeps the browser bars from pushing items off screen.
- **Never smaller than desktop:** `--ring` is `max(--ring-desktop, --ring-phone)`. `--ring-desktop` is the unchanged desktop formula, now named, so wider phones and small tablets in portrait keep the desktop sizes.
- **Text slot:** a fixed 6rem (96 px) on phones, so the controls never move. The text sits inside the page gutter.
- **Slogan:** always breaks after its comma on phones, as specified ("Daha iyi duruş, / daha sağlıklı yaşam."). Before, it broke only when out of room; on one line at 390 px it came within 10 px of the screen's edges.
- **Labels:** 14 px UI text outside the ring. The 5 o'clock label reaches into the room beside the ring.
- **Figure:** the dot figure scales with the stage, so it is about 250 px tall at 390 px wide.

Measured in Chrome (iframes, TR and EN):

| Viewport | Ring | Controls' bottom edge |
|---|---|---|
| 360 × 640 | 269 px | 564 |
| 375 × 548 | 252 px | 547, inside the 548 fold |
| 390 × 664 and 390 × 844 | 294 px | 589 |
| 430 × 932 | 300 px (the cap) | 595 |

At every size and every scrubbed phase (0, 9000, 13 500, 18 500, 24 000, 26 200 and 30 300 ms) the text slot stayed 96 px, the controls didn't move and nothing scrolled sideways. The Instagram label ended inside the gutter (right edge 321 px at 360 wide). A real-time playthrough at 390 × 844 had a median frame of 8.3 ms and a maximum of 9.5 ms.

Desktop is unchanged: at 1440 × 900, 1280 × 768, 1024 × 768, 768 × 1024 and 800 × 600 the ring equals the old formula exactly, with no phone rules applied.

**Phone landscape side column (plan step 9, built 2026-10-25):**

The approved specification is item 6 of the same block: below about 32rem of height, the text and controls move into a column beside the ring; everything else stays as on desktop. Before this, landscape phones used the desktop formula, which left the ring 38 px wide at 740 × 390 and 8 px at 740 × 360.

The rules are CSS only, in `HomeIntro.astro`, under `@media (orientation: landscape) and (max-height: 32rem) and (max-width: 60rem)`. The widest phones are about 58rem, so tablets and desktop windows are left out. A desktop window shorter than 512 px and narrower than 960 px would also match.

- **Grid:** two columns, `auto minmax(0, 20rem)`, with a 40 px gap (`--space-5`) and the page gutter as padding. The rows are `1fr auto auto 1fr`. The ring spans every row; the text (row 2) and the controls (row 3) are centred on it in the second column. Text stays centred, as on desktop.
- **Ring size:** `--ring` is the smaller of two bounds:
  - **height:** `100svh − --header − 1.5rem` (its 1rem top padding plus 0.5rem below the ring), so the ring and its labels stay on screen;
  - **width:** `100vw − 2 × gutter − 2 × --label-room − 40 px − 12rem`, which leaves the column at least 12rem.
- **Label room:** `--label-room` is 0 in tier A. In tier B (`intro--side-labels`) it is 72 px, also used as the ring's side margins. In tier A the 5 o'clock label reaches about 11 px into the gap, never into the column.
- **`--header` mirrors `SiteHeader.astro`:** its padding (2.5rem, or 4rem from 48rem wide), plus the lockup's height, plus the 3 px rule. The lockup is `clamp(10.5rem, 6.5rem + 11vw, 16rem)` wide with the 271.22 × 104 viewBox of both languages. This matched the measured header: 107 px at 568, 111 at 667, 114 at 740, 142 at 844 and 146 at 932. **If the header's padding or lockup size changes, update this too.**
- **Text and slogan:** the text slot keeps its fixed 6rem and the slogan breaks after its comma, as in portrait.
- **Notches:** the viewport meta has no `viewport-fit=cover`, so browsers keep content clear of them and the safe-area insets are 0.

Measured in Chrome (iframes, TR and EN). Each scrubbed phase was checked (0, 4500, 9000, 13 500, 18 500, 24 000, 26 200 and 30 300 ms): the controls kept one position and nothing scrolled sideways.

| Viewport | Ring | Lowest ring or label edge |
|---|---|---|
| 740 × 390 | 252 px | 382 |
| 740 × 360 | 222 px | 352 |
| 667 × 375 | 239 px | 367 |
| 844 × 390 | 224 px | 382 |
| 932 × 430 | 260 px | 422 |
| 568 × 320 | 189 px | 315 (the Instagram label, 5 px above the fold) |

A real-time playthrough at 740 × 390 had a median frame of 8.3 ms and a maximum of 9.4 ms. Portrait (269/252/294/300 px, 96 px text slot) and desktop (the formula exactly at 1440 × 900, 1280 × 768, 1024 × 768, 768 × 1024, 800 × 600 and 1024 × 500) were unchanged after this.

Not tested: landscape heights under 320 px, real phones (Safari's changing bars, notched devices) and other browsers. On very short screens the ring keeps shrinking with no minimum, so that it stays on screen.

**Known limitations:**

- **Dot contrast:** individual dots are about 2.2–2.5:1 against the ground; the spine accent is 3.7:1. The palettes are canvas fills in TypeScript, not tokens.

### Homepage integration (plan step 10, built 2026-10-25, complete, uncommitted)

The plan's step 10 (`../SESSION-HANDOFF-2026-10-23-homepage-intro-storyboard.md`): `ComingSoon.astro` uses the new scene; the slogan becomes the `<h1>`, with the coming-soon line under it; the meta description is unchanged; the language link comes off the ring. The behaviour follows that note's approved blocks "Controls and other states" and "coming-soon text, Replay and stop control".

**Integration points (files changed):**

- `src/components/ComingSoon.astro`: renders `<HomeIntro frame="live" figure="dots" homepage>` (id `home-intro`) in place of `ritual/WelcomeRitual.astro`, and starts it with `startHomepageIntro`. Its `translations` prop is gone, so both `index.astro` pages no longer pass it. Nothing else in them changed: title, meta description, `lockup` and `ritual`.
- `src/components/home-intro/homepage.ts` (new): the production wiring around the unchanged `createDotScene`. It handles the states, the stop control, Replay, the reduced-motion switch and focus.
- `src/components/home-intro/HomeIntro.astro`: the `homepage` prop (`data-intro-homepage`) and its styles ("On the homepage"); none of them apply without the prop.
- `src/layouts/BaseLayout.astro`: comments only. The `ritual` pre-paint script is reused unchanged, including its session-storage key `pilatesegitmeni:welcome-ritual`, shared by both languages.

**Shared, not duplicated:** the dev preview and the homepage render the same `HomeIntro.astro` live frame and play the same `dotScene.ts` scene. So the figure, its settings, the timeline (30 300 ms), the copy and the step-9 layouts are identical. `ritual/`, `config/ritual.ts`, `dot-figure/`, `dotScene.ts`, `scene.ts`, `geometry.ts`, the tokens and the prototypes are unchanged (SHA-1 checked). `WelcomeRitual.astro` and `IntroRitual.astro` stay on disk, unused by any built page, as the plan says. `coming-soon.json`'s `label` (the old hero description) is no longer shown; it stays as the meta description, as approved.

**Homepage behaviour** (`data-intro` on `<html>`):

- **First visit in the tab:** BaseLayout sets `starting` before the first paint. The script plays the scene from its first frame (`playing`), then `rest` when it ends. The stop control appears once the script runs.
- **Second visit in the same tab** (either language): `rest`, the still end state, painted from the first frame by CSS: the front view, the whole ring with Instagram, the slogan, the coming-soon line and Replay. The figure appears when the script draws it.
- **Stop control:** stops at once and shows the same still end state. Focus moves to the ring's first link (Instagram), and Replay takes its place. The stop lasts for the visit: the tab is `rest` from then on.
- **Replay:** a 200 ms fade (the welcome ritual's), then the whole scene from its first frame, with focus on the stop control. Clicks within 700 ms of Replay appearing are ignored, so a double click on the stop control doesn't restart it. If focus is on the stop control as the scene ends, it moves to the first link, or to Replay after a Replay (as in the ritual).
- **Reduced motion:** no state, the still end state, no stop control and no Replay. The title and the cues stay for screen readers. Switched on while it plays: it stops as with the stop control, and focus moves on only if it was on the stop control.
- **No scripting:** the same still state without the figure (it is canvas-drawn) and without controls.
- Not built, as specified for one item: no cycle, and no Instagram pose. The end state is the standing idle.

**Deliberate differences from the dev preview:**

- The preview's dev bar, its frame switcher, the still `#opening`/`#idle` frames and its autoplay-on-show exist only there.
- The preview's stop and Replay stay unwired.
- Pre-paint states and the reduced-motion and no-script versions exist only with `homepage`.
- Under reduced motion, `global.css` gives every element a 0.01 ms transition. On the homepage, the ring links and the controls have `transition: none`, because otherwise the link the scene had just shown was still hidden, and so unfocusable, when the stop control handed focus to it (found in review).

**Verified (2026-10-25):**

- `npm run check`: 0/0/0, and 17/17 contrast pairs pass.
- `npm run build`: `check-dist` clean; the pages are `/`, `/en/` and `/404.html`.
  - The dev-only grep above and a grep for the old ritual's markup (`welcome__|data-welcome|ritual__|orbit__`) find nothing.
  - Each page has one `<h1>`, the slogan; meta descriptions, canonical and hreflang are unchanged.
  - The intro script was 80 KB (31 KB gzipped) at step 10; 18.9 KB (8.6 KB gzipped) since the character artwork and the old intro's timing code were taken out of it ("Homepage bundle: character artwork removed" below).
- **Chrome, the user's browser** (dev server, 1512 × 949):
  - a full first visit on `/`, checked by screenshots and a 250 ms state log: the roll-down, the return, each cue, the slogan, the turn and the menu, `rest` at about 30.4 s;
  - the second visit in TR and EN;
  - Stop (keyboard), with focus to Instagram;
  - Replay, with the fade and focus to the stop control;
  - focus moving from the stop control to Replay at the natural end;
  - the double-click guard;
  - no console errors.
- **Responsive, full sequence in real time** (scaled same-origin iframes, TR and EN, every 200 ms to `rest`):

  | Viewport | Ring |
  |---|---|
  | 1440 × 900 | 548 |
  | 1280 × 768 | 416 |
  | 360 × 640 | 269 |
  | 375 × 548 | 252 |
  | 390 × 664 | 294 |
  | 430 × 932 | 300 |
  | 740 × 390 | 252 |
  | 740 × 360 | 222 |
  | 844 × 390 | 224 |
  | 568 × 320 | 189 |

  These equal step 9's. At every viewport:
  - one constant controls position;
  - the ring, its label and the visible control inside the viewport;
  - no sideways scroll;
  - the label never overlaps the text or the controls.
- **Reduced motion with the browser's real media emulation:** headless Chrome via the DevTools protocol (`Emulation.setEmulatedMedia`), against both the dev server and `astro preview` of the build.
  - From load in TR and EN: still, and unchanged 1.5 s later.
  - Switched on mid-intro with focus on the stop control: `rest`, focus on Instagram.
  - With scripting disabled.

**Not verified:**

- real phones, Safari and Firefox, and VoiceOver;
- the system reduced-motion setting itself (only the browser's emulation);
- a slow network, where the script arrives after BaseLayout's 3 s fallback: by design the visitor then gets the still end state without the intro;
- the dev-toolbar pill of `astro dev` overlaps the controls on the dev server only; it isn't in the build.

### Final validation (plan step 11, 2026-10-25, complete; the timing tuning is still open)

The plan's step 11: `npm run check`, `npm run build` (check-dist) and a dist grep; Chrome at 1440 × 900, 1280 × 768, 360 × 640, 375 × 548, 390 × 664 and landscape about 740 × 360; reduced motion, keyboard only, a VoiceOver spot check; timing tuning with the owner.

Browser checks ran against the **production build** (`astro preview` of `dist`), not the dev server. Nothing is committed, pushed or deployed.

**Verified:**

- **Approved settings, in the code:** `YAW` 70; `LOOK` radius 1–4, spine and depth on; `sampleFigure('dense')`; the `clay-sage` palette; `LAG` 45 (fluidity 0.5); `STOPS` standing → down → standing, then the turn to the front and the menu.
- **Copy:** the title, the four cues (`config/ritual.ts`, Turkish the owner's, English approved 2026-10-23), the slogan, the coming-soon line, and the stop and Replay labels (`config/home-intro.ts`) match the approved text.
- **`npm run check`:** 0 errors, 0 warnings, 0 hints; 17/17 contrast pairs pass.
- **`npm run build`:** `check-dist` clean. The pages are `/`, `/en/` and `/404.html`; the sitemap has `/` and `/en/`.
  - The dev-only grep and the old-ritual grep find nothing.
  - The bundle has no `data-dev`, `__ritual`, `localhost`, `createPlayer` or scene code.
- **Pages:**
  - `lang` is `tr` and `en`;
  - one `<h1>` per page, the slogan;
  - titles and meta descriptions are unchanged;
  - canonical and `og:url` point to the page itself;
  - hreflang is reciprocal (tr, en, x-default);
  - the header language link goes to the other page;
  - the 404 page has no intro and is unchanged.
- **Diff review:** the step-10 changes match their description, with no leftover integration artifacts. The other modified files in `git status` (`scripts/check-*.mjs`, `tokens.css`, …) are earlier sessions' uncommitted work.
- **Chrome (the user's browser), full sequence in real time:** TR and EN at each of the plan's sizes, plus 430 × 932, 740 × 390, 844 × 390 and 568 × 320. Sampled every 200 ms until `rest`, which came at about 30.4–30.8 s with the iframe load.

  | Viewport | Ring | Controls' top |
  |---|---|---|
  | 1440 × 900 | 548 | 841 |
  | 1280 × 768 | 416 | 705 |
  | 360 × 640 | 269 | 520 |
  | 375 × 548 | 252 | 503 |
  | 390 × 664 | 294 | 545 |
  | 430 × 932 | 300 | 551 |
  | 740 × 360 | 222 | 281 |
  | 740 × 390 | 252 | 296 |
  | 844 × 390 | 224 | 312 |
  | 568 × 320 | 189 | 257 |

  These equal steps 9 and 10. At every size:
  - the controls never moved;
  - the ring, its label and the visible control stayed inside the viewport;
  - no sideways scroll;
  - no visible text past the screen's edges;
  - the label never overlapped text or a control;
  - the text slot kept one height (80, 96 or 101–112 px by layout).
- **Keyboard only** (real key presses, Chrome, build):
  - During the intro, Tab goes skip link → logo → header language link → stop control → footer. The hidden ring link is skipped.
  - Space on the stop control gives the still menu, focus on Instagram with the visible focus outline; Tab → Replay.
  - Enter on Replay replays, with focus on the stop control. Left there to the end, focus moves to Replay.
- **Reduced motion** (headless Chrome, `Emulation.setEmulatedMedia`, build):
  - from load in TR and EN: still, unchanged 1.5 s later, no controls, the canvas drawn;
  - switched on mid-intro with focus on the stop control: `rest`, focus on Instagram;
  - without scripting: the still state, no figure;
  - at 360 × 640, 375 × 548, 390 × 664, 740 × 360 and 568 × 320: the ring and its label on screen, no sideways scroll.
- **Accessibility tree** (Chrome's, through the DevTools protocol; *a proxy, not VoiceOver*):
  - the region is named by the slogan, the only `h1`;
  - "Keşfet" / "Explore" holds the Instagram link once shown;
  - the stop control is named "Animasyonu durdur" / "Stop animation";
  - after a stop, Replay is "Yeniden izle" / "Watch again", described as "Giriş animasyonunu yeniden oynat" / "Replay the intro animation";
  - the title and the four cues are there as text; the figure's canvas and SVG are hidden.

**Corrected in this step:** documentation only. The step-10 note wrongly said the live site shows the welcome ritual; it shows the committed plain coming-soon text. The posture ritual's 2026-10-20 "Next step" now says it was superseded.

**Found, not changed (for the owner):**

1. **Unused character artwork in the homepage script:** about 48 KB of the 80 KB script was the two characters' SVG path data. *Resolved afterwards on the owner's instruction*; see "Homepage bundle: character artwork removed" below.
2. **The 2026-10-24 revision versus the approved dev intro.** The revision's starting specifications were approved in principle for the character intro (step 4c, never built). The dot intro, the reference for steps 9–10, was retimed by Claude to the movement (awaiting review), so they differ:
   - **Time fully visible:** the revision wants about 3 s per message. The title has 8.9 s, the back 2.25 s, the crown 1.5 s, the chin 1.35 s and the breath 3.55 s.
   - **Cue size:** the cues are smaller than the title (`clamp(1.25rem…1.75rem)` against `clamp(1.75rem…2.75rem)`), where the revision wants title size.
   - **Cue set:** the revision's five-cue set ("Çeneni hafifçe içeri al ve yukarı uzan." / "Burnundan nefes al." / "Ağzından nefes ver.") isn't used; the four approved cues are.

   This is plan step 11's "timing tuning with the owner", and it needs the owner's decision.
3. **An empty landmark during the intro:** the "Keşfet" / "Explore" navigation is exposed while its link is still hidden, about 29 s.
4. **Unreviewed or stale labels and comments:**
   - the ring's label "Keşfet" / "Explore" is still unreviewed (since step 2);
   - `config/ritual.ts`'s header still calls the English cues unreviewed, though the owner approved them on 2026-10-23. Its `stop` label, "Hareketi durdur", isn't used: `home-intro.ts`'s is.
   - `coming-soon.json`'s `label` is unused.

**Not verified:**

- the VoiceOver spot check (no screen reader was run; only Chrome's accessibility tree);
- the timing tuning with the owner;
- real phones and tablets, Safari, Firefox;
- the system reduced-motion setting (only emulation);
- a slow network;
- Windows high-contrast or forced colours.

### Homepage bundle: character artwork removed (2026-10-25, after step 11, complete)

**The path in:** the homepage script (`ComingSoon.astro` → `homepage.ts` → `dotScene.ts`) imports the ring's constants from `geometry.ts`. That module ended with `export const handsOnHips = reach(…)`, a call made when the module loads. `reach()` reads `designs` from `ritual/characters`, which brings in both characters' artwork (`male-paths.ts`, `female-paths.ts`, `male.ts`, `female.ts`). The bundler can't drop a call it must assume has side effects, so the homepage shipped the artwork without using it.

**The change** (one line plus a comment, `geometry.ts`): the call is marked `/* @__PURE__ */`.
- A bundle that doesn't use `handsOnHips` (the homepage's) now leaves the call and the artwork out.
- Where it is used, it is computed as before: `HomeIntro.astro`'s character still frames, `scene.ts`, and the turn test through `geometry.ts`.
- No file moved, nothing was duplicated, no character file was removed.

**Measured** on the built asset `dist/_astro/ComingSoon.astro_astro_type_script_index_0_lang.*.js`, same method before and after:

| | Before | After |
|---|---|---|
| Raw | 79 795 B | 20 050 B (−75%) |
| `gzip -9` | 30 919 B | 8 990 B (−71%) |

**The module graph:** Vite's build API on the same entry (`homepage.ts`) with each chunk's per-module rendered bytes, a scratch script, not in the repo.
- **Before:** 106 181 rendered bytes, 68 KB of it legacy: `male-paths.ts` 25 232, `female-paths.ts` 23 450, `female.ts` 8 483, `male.ts` 8 116, `characters/index.ts` 99, `ritual/intro/*` and `proportions.ts`.
- **After:** 39 372, with no `ritual/characters` module.
- The built script contains no `female`, `male`, `designs` or `fingertips` identifiers, and no SVG path data.

**Then: the old intro's timing code removed** (2026-10-25, on the owner's instruction).

- **The path in:** `dotScene.ts` imported only `ease`, the cubic-bezier(0.45, 0, 0.25, 1) curve, from `ritual/intro/pose.ts`. Loading `pose.ts` evaluates its own imports, `ritual/intro/timeline.ts`, `poses.ts` and `frontPose.ts`. Their top-level calls (`breathEase`, `motionTrack`'s breath moves, `armCarriers`, `chain`) count as possible side effects, so the bundler kept them unused.
- **Not done:** annotating those calls, because the five approved motion files stay unchanged (SHA-1 checked: every `ritual/` file is identical).
- **The change** (two lines plus a comment):
  - `dot-figure/timeline.ts` already had its own copy of the same curve (the sentences' fades), written the same way. It is now exported.
  - `dotScene.ts` imports `ease` from there, with its other timeline imports, instead of from `pose.ts`.
  - Nothing was duplicated: the homepage now uses one curve instead of two.
- **Same curve, bit for bit:** both functions, loaded from the sources through Vite, give identical results (`Object.is`) on 2 000 001 direct samples, including values below 0 and above 1. They also match on 1.79 million samples read back through `sentenceOpacity`.

**Measured** (same method as above):

| | Before | After |
|---|---|---|
| Raw | 20 050 B | 18 896 B (−1 154 B, −5.8%) |
| `gzip -9` | 8 990 B | 8 603 B (−387 B, −4.3%) |

From the original 79 795 / 30 919 B, that is −76% raw and −72% gzipped.

- **The module graph:** 39 372 → 36 807 rendered bytes. `ritual/intro/timeline.ts`, `pose.ts`, `poses.ts` and `frontPose.ts` are gone; the built script contains no `breathEase`, `motionTrack`, `armCarriers`, `INHALE` or `EXHALE`.
- **Everything else in `dist`** is byte-identical. `index.html` and `en/index.html` differ only in the script's file name.

**Playback identical, deterministically:**

- **Method:** a test harness (scratch only) replaced `requestAnimationFrame` and `performance.now` in headless Chrome. It stepped 16 ms frames from page load and recorded, at 14 times from 0.5 s to 31.5 s:
  - every value the scene writes (the sentences', slogan's and coming-soon line's opacity, the line's attributes, the clip, the ring item's `--dot`, the link's and controls' fades);
  - a hash of the canvas pixels.
- **Result:** `/` and `/en/` against the old and new builds, each run twice. Every run was identical, at every time; both reach `rest`.
- **Not usable:** Chrome's own virtual time (`Emulation.setVirtualTimePolicy`) produced almost no animation frames headless.

**Also verified after this change:**

- `npm run check` 0/0/0 and contrast 17/17; `npm run build` with `check-dist` clean. The dev-only and old-ritual greps on `dist` find nothing.
- In your Chrome, the built `/` (served by `astro preview`, stopped afterwards) played in real time: the same sentence sequence, `rest` at 30.5 s, no console errors.
- Dev server, no console errors:
  - `/dev/posture-intro/#play`, the legacy intro on `pose.ts`'s `ease`, plays;
  - `/dev/home-intro/#live` plays with all three frames drawn;
  - `/dev/dot-figure/` loads.

**Still in the bundle** (no artwork, about 1.7 KB rendered):
- `ritual/proportions.ts` (957 B), reached through `geometry.ts`'s `openingCamera`/`LINE_AT` (`pelvis.top`);
- `geometry.ts`'s two cameras (part of its 752 B), unused on the homepage.

**Investigated, declined: the proportion constants** (2026-10-25). The owner declined Option C (variant C below): the remaining constants stay in the bundle on purpose.

- **The path:** `homepage.ts` → `dotScene.ts` → `geometry.ts`, which imports `CX`, `FLOOR` and `pelvis` from `ritual/proportions.ts` for the character's cameras (`idleCamera`, `openingCamera`, `LINE_AT`).
- **Used on the homepage:** `dotScene.ts` uses only `STAGE`, `RING`, `LINE_HALF`, `RING_BOTTOM` and `chordHalf` from `geometry.ts`. None of them depend on the proportions.
- **Why it stays:**
  - `proportions.ts` runs `heads(…)` at its top level (`y`, `pelvis`, `spine`, `headPivot`), so any bundle that imports the module keeps it, used or not.
  - `geometry.ts`'s two `camera()` calls and `LINE_AT = pelvis.top` are kept too.
- **Variants tried** in scratch copies of `src`, nothing in the repository changed. Measured with Vite's library build of `homepage.ts`, whose absolute sizes differ from Astro's:

  | Variant | `proportions.ts` in the bundle | Minified | `gzip -9` |
  |---|---|---|---|
  | Today | yes | 27 819 B | 9 964 B |
  | A: the cameras marked `/* @__PURE__ */` in `geometry.ts` only | **still in** | 27 697 B | 9 915 B |
  | B: A, plus every `heads(…)` call marked pure in `proportions.ts`, a legacy ritual file | **still in** | 27 586 B | 9 862 B |
  | C: the five ring constants in a new `home-intro/ring.ts`, imported by `dotScene.ts` and re-exported by `geometry.ts` | **gone** | 27 310 B | 9 743 B |

- **C with the real build** (`npm run build` on a scratch copy of the project, check-dist clean):

  | | Today | C |
  |---|---|---|
  | Raw | 18 896 B | 18 513 B (−383 B, −2.0%) |
  | `gzip -9` | 8 603 B | 8 406 B (−197 B, −2.3%) |

  C's script has no proportions code left: `pelvis.top`'s `top:q(3.36)` is gone, and today's script has it.
- **Why not done:** only C removes the constants, and C restructures the shared geometry. It adds a module and moves five constants out of `geometry.ts`, which re-exports them, so its other users (the dev preview, `scene.ts`, the turn test) are unaffected. The owner asked for that trade-off to be reported first. The gain is about 0.2 KB gzipped.
- **Ruled out:** B also edits a legacy ritual file without removing the module.
- **For reference, if this is ever revisited:** the scratch variant is the whole change: a new `ring.ts` (5 exports), `dotScene.ts`'s import line, and `geometry.ts` importing and re-exporting them instead of declaring them.

**Verified:**

- **Output unchanged:** the homepage canvas at the still end state is pixel-identical (SHA-1 of the canvas PNG) with the old and new bundles. Both were served by `astro preview`, and each page's loaded script was checked. Viewports: `/` 1440 × 900 and 390 × 664, `/en/` 1280 × 768 and 740 × 360.
- **The built `/` in Chrome, first visit:**
  - roll-down at about 5 s;
  - the crown, chin and breath cues, the slogan, the menu reveal and Replay at the timeline's times (within about 150 ms of page load);
  - `rest` at about 30.4 s;
  - no console errors.
- **The built `/en/`:** the back cue mid roll-down, then the final menu; `rest`; no console errors.
- **Dev server:**
  - `/dev/home-intro/`: `#idle` drawn; all three canvases drawn; `#live` plays.
  - `handsOnHips` still evaluates in the browser: shoulder 30.66°, elbow −108.49°, wrist 79.23°.
  - `/dev/home-intro-turn/` draws the character and runs.
  - No console errors.
- **Checks:** `npm run check` 0/0/0, contrast 17/17; `npm run build` with `check-dist` clean. The dev-only and old-ritual greps on `dist` find nothing; `dist` holds only `/`, `/en/` and `/404.html`.

**Not verified:**

- `/dev/posture-intro/` and the other character prototypes, which don't import `geometry.ts`;
- real devices, Safari and Firefox (unchanged from step 11).

### Opening scene (built 2026-10-25, uncommitted; partly superseded on 2026-10-26)

*Superseded by "Animation revision (2026-10-26)" below: the waist-up framing, the 60% opening pose, the roll-down and its pull-back, the line at the waist, and the menu dot riding out on the ring. The single dot, the ring opening, the line drawing out and the dots spreading from the centre are kept.*

The owner asked for a new opening scene and approved the plan with three decisions: a 2.5 s opening **before** the existing timeline (option A), the **Instagram dot** taking part in it (its label still waits for the reveal; the header isn't animated), and a **60% hunch** as the first pose. Cue wording, cue timing relative to the movement, typography, the slogan, easing, the renderer and everything from the end of the roll-down on are unchanged.

**What it does** (scene time, ms; the intro's own time starts at 2500):

- 0–300: a single dot at the ring's centre (every dot of the figure stacked there); no ring, line or text.
- 300–1400: the ring opens from that point to its unchanged size (CSS `scale` on the `<circle>`, `transform-box: view-box`, origin at the centre). The Instagram dot rides out on it from the centre and grows with it.
- 800–1700: the line draws out from its middle at the **waist**, its pre-dot place restored: `LINE_Y` (stage y 868), half-length `LINE_HALF` (1.1 × r), same stroke.
- 300–1600: the dots spread from the centre into the figure, the nearest first with a little scatter (each dot's own way out is 55% of the span, eased with the intro's `ease`). Dots below the waist rise 12 model units from under the line instead, so none crosses the figure or half-shows at the line early.
- 1600–2500: her sparse lines fade in (900 ms, as after any settled pose).
- From 2500: the old timeline, every time +2500 ms. She starts in the **opening pose** (60% of `halfway`), **waist-up**: the body above the waist (model y 104, about L3) is centred on the ring and its top sits 72% of the diameter above the line, as in the character version's opening. The ring above the line frames her; the SVG clip hides the ring below it and a CSS `clip-path` on the canvas hides her below it (the SVG clip doesn't reach the canvas).
- Roll-down 4420–9620 (intro 1920–7120), from the hunch, with its approved 5200 ms duration. **Pull-back** over its first half, 4420–7020: the scale shrinks evenly to the full-body framing, her waist sinks to the line as the line moves from her waist (868) to her feet (`DOT_FLOOR`, 923); her legs come up into view. The head stays above the waist line until the fold is past half way (measured), so nothing leaves the frame. At the end the framing is exactly the old `PLACEMENT` and the canvas clip is removed.
- The Instagram dot is hidden below the line, like the ring (5 o'clock is stage y 898, below the waist line): it is visible about 400–1150 ms as the ring opens, slips under the line as the ring arrives, and comes back as the line passes it during the pull-back (about 5.9 s). Its label still fades in at the reveal (31 600 ms).
- Everything after: as before, +2500: slogan 25 060, turn 28 330–29 100, line closed 29 500, reveal 31 600, end **32 800 ms**.

**Files changed** (nothing else):

- `src/components/dot-figure/timeline.ts`: `OPENING_POSE` (60% of `POSES.halfway`), the first move starts from it while its duration is still computed from standing (5200 ms, so every later time is unchanged), `DOWN` exported.
- `src/components/home-intro/dotScene.ts`: the opening ("The opening" section: `OPENING` 2500, `frameOpening`, `placementAt`, `emerge`), scene time `t` vs intro time `i = t − OPENING`, the ring's scale, the line's draw-out and move down, the Instagram dot's position, growth and clip at the line, the canvas clip, the `#opening` still (now the formed waist-up hunch).
- `src/components/home-intro/HomeIntro.astro`: the line rendered at `LINE_Y` for the dots too; the ring's transform origin; before the script, the live dot frame's ring is at scale 0 and its line hidden (the homepage's still states keep both, the line hidden as before); comments.
- Unchanged (SHA-1): `model.ts`, `render.ts`, `palettes.ts`, `homepage.ts`, `geometry.ts`, `scene.ts`, `turn.ts`; every `ritual/` file.

**Verified (2026-10-25):**

- `npm run check`: 0 errors, 0 warnings, 0 hints; 17/17 contrast pairs pass.
- `npm run build`: `check-dist` clean; pages `/`, `/en/`, `/404.html`; the dev-only and old-ritual greps on `dist` find nothing. The homepage script is 20 589 B raw, 9 349 B `gzip -9` (was 18 896 / 8 603).
- Chrome, dev preview (TR), scrubbed: 0, 650, 1000, 1200, 1300, 2000, 3200, 5200, 6000, 7000, 10 500, 26 500, 29 300 and 32 800 ms; the `#opening` and `#idle` stills.
- **Old timeline + 2500, read from the DOM** at each old beat (±1 ms / +451 ms): the title, the four cues, the breath cue's end, the slogan in/out, the line's ends drawing back, the line closing, the label reveal, the slogan back and Replay all switch exactly 2500 ms later than before. The Instagram item is back at its rendered place (73% / 89.84%) once the ring has opened.
- `/` in real time, first visit (dev server): `rest` 32.97 s after load; median frame 8.3 ms, worst 9.4 ms; no console errors. The built `/` (`astro preview`): opens from the dot, `rest` at 33.0 s, no console errors.
- `/en/` in real time: the opening and the title "Remember and Repeat" over the waist-up hunch; Stop during the opening → `rest`, the whole ring, focus on Instagram, the line hidden and both clips cleared; Replay → the opening again from the dot, focus on the stop control.
- First-paint rules (computed): `starting`/`playing` → ring scale 0, line hidden, item dot 0; `rest` and no state → ring 1, item dot 1.
- Phones (same-origin iframes): 390 × 844 (TR), 375 × 548 (EN) and 740 × 360 (TR), at 3300 and 6200 ms: framed inside the ring, no sideways scroll.

**Limitations and notes:**

- The Instagram dot shows only briefly in the opening (about 0.75 s) because its 5 o'clock place is below the waist line; it returns during the pull-back.
- The waist-up view draws the dots larger (the renderer's radius rule, ∝ scale^0.65: about 1.7× at the opening's 2.3× zoom).
- The dev preview with reduced motion doesn't autoplay and so shows the scene's first frame, now the single dot. The homepage's reduced-motion and no-script states are the unchanged still menu.
- Not checked: Safari and Firefox (CSS `scale` on an SVG `<circle>` and `clip-path` on a canvas), real devices, VoiceOver.

**State at the end of 2026-10-25:** implemented and verified as above; awaiting the owner's visual review. All changes are saved in the working tree; nothing is committed, pushed or deployed, and the live site is unchanged (`dbd5fe4`). The `astro preview` server used for the build check was stopped. The `astro dev` server (port 4321) was already running before this session and was left running.

**Next task (requested by the owner on 2026-10-25; superseded on 2026-10-26, not done):** keep the Instagram dot visible above the horizontal line during the opening. *The 2026-10-26 revision's phase 1 shows the menu's dots only at the reveal, so this no longer applies.*

- **Today's behaviour:** the dot rides out on the opening ring, but its 5 o'clock place (stage y 898) is below the waist line (868). `dotScene.ts` clips it at the line like the ring (`itemDots[n].style.clipPath`, the `under` value in `apply`), so it shows only about 400–1150 ms, then slips under the line until the pull-back brings the line past it (about 5.9 s).
- **Tomorrow:** inspect the current implementation first, then make the smallest safe change that keeps the dot visible above the line while the circle and the figure form.
- **Keep:** the Instagram position and intended design as far as possible. Don't change the circle animation, the figure's formation, the line animation, intro timing, cue wording, the movement choreography or the later label reveal unless the fix strictly requires it. If a trade-off is needed (for example, where the dot rests while the line is above its ring position), explain it to the owner before any broader change.

### Animation revision (2026-10-26, built and verified, uncommitted, approved by the owner)

The owner's ordered plan, five phases, each built and checked in Chrome before the next. Reviewed on `/dev/home-intro/#live`; the same scene plays on `/` and `/en/`.

**Decision by the owner during the work (2026-10-26):** at the 5460 ms zoom a hand raised above the head leaves the stage (the canvas's top is at body height 171, the head's top). Of four options (same zoom placed lower; exact framing with the hand cut off; a camera move for the reach only; a smaller zoom), the owner chose **the same zoom, the figure placed lower for the whole intro**: 44 model units (`DROP` in `dotScene.ts`), constant from the first dot to the end of the instructions. The line stays where it was at 5460 ms (stage y 897.3) and now crosses her at the hips; the hunch sits lower in the ring.

**The sequence** (scene time, ms; the intro's own time starts at 2500, as before):

| Scene | What happens |
|---|---|
| 0–2500 | The opening as before (single dot, ring opens, line draws out, dots spread from the centre), but in the fixed framing and forming straight into the hunch; lines in. |
| 2500–2950 | "Hatırla ve Tekrarla" fades in over the held hunch. |
| 2950–5950 | **The 3 s hold**: the title fully shown, the hunch still (its lines clear in the last 320 ms; the title fades out over the last 450). |
| 5950–11 150 (+135) | **"Sırtını yavaşça düzelt"**: the straightening, 5200 ms (the approved return to standing's duration), the lower back first. The cue stays until the last dots settle (11 285) and only then fades. |
| 11 835– | **"Başının tepesinden yukarı uzan"**: the turn to 45° (545 ms) and the right arm (nearer the viewer) up, elbow out, forearm angled up over the head, hand about 10 units above the crown (1800 ms); then the elbow straightens slowly and the hand rises until the arm points straight up (2600 ms); held 900 ms. |
| 17 405–19 340 | The arm comes down (1800 ms) and the view turns back to 70°; the crown cue fades as it starts. |
| 19 340– | **"Derin bir nefes al"** once she is still, arms down; the breath in 19 790–22 790 (3000 ms): the rib cage widens and lifts, the ring widens to 1.05× with it. |
| 23 340– | **"Yavaşça nefes ver"**; the breath out 23 790–26 790, **exactly 3000 ms**, the rib cage and the ring back together. |
| 26 790–27 240 | The breath-out cue fades. |
| 27 340– | **The motto** fades in and stays; with it the turn to the front (770 ms) and the view widening to the full body (1600 ms), the line moving down to her feet (stage y 923.2). |
| 28 940 | She stands in the front view, full body: the menu's dot and label fade in **together** (300 ms per item). The lines come back 450 ms later. |
| 29 240 / 29 540 | Replay takes the stop control's place; the coming-soon line fades in. End: 29 990. |

**Per phase:**

1. **Menu visibility.** The item's dot no longer rides out on the opening ring: `--dot` and the label share one fade, from `REVEAL_AT`, which is now the moment the front full-body pose is reached (no fixed 2.5 s delay). Measured: both first appear at 28 950 (sampled every 10 ms; due at 28 940), never earlier.
2. **Framing and hunch.** `FIXED = ease(0.4)`: the pull-back's progress at 5460 ms of the 2026-10-25 scene, so the scale is that frame's exactly (line at 897.30, as it was then); plus the owner's `DROP`. `HUNCH` (`timeline.ts`) is exactly the 2026-10-25 roll-down's pose at 7140 ms: `cascade(OPENING_POSE, down, 2720/5200)`; the head, neck and upper back fully rounded, the lower back and pelvis barely moved. The dots below the line now rise from under it by the line's own height (`under`), so the legs no longer appear in place before the rest.
3. **The first two cues.** No roll-down. The cues' timing follows the moves (`sentenceTrack`), each movement's cue staying until the move has settled. **Cue size:** every cue now has the title's rule (`clamp(1.75rem, 1.375rem + 1.667vw, 2.75rem)`, weight 300, line height 1.15); measured 43.4 px for all five at 1284 px wide.
4. **Reach and breath.** Two additions to `model.ts`, both inert for the approved figure (same dots, same seed sequence, same poses): channels `shoulderR`, `elbowR`, `wristR` (the right arm only, added to the paired channels; `pose()` now adds every channel's angles to its bones, identical for the old ones); and per-dot `rib` weights with `breathe(dots, pos, amount)` (the torso between rest heights 108 and 134 widens and deepens by 26% and lifts 2.4 units at a full breath; standing pose only). `timeline.ts` adds `REACH_LOW`/`REACH_HIGH`, `REACH_YAW` (45), `yawAt`, `breathAt`, and a per-move `spread` (0 for the arm: every joint together). The chin cue is gone.
5. **Motto and ending.** The slogan is now the motto: it comes in after the last cue and never fades out. Italic Newsreader at the cues' size, between quotation marks (`“ ”`, `quotes` in `config/home-intro.ts`, `aria-hidden`) in `--color-accent`; `intro__slogan--motto` applies only with the dots. The line never goes: it moves to her feet with the pull-back and stays, with the ring clipped below it. The homepage's still state (`rest`, reduced motion, no script) now keeps the line too: the markup puts the dots frames' line at `DOT_FLOOR` (the opening still at `FIXED_LINE_Y`), and the `rest` rules show it instead of hiding it and unclipping the ring.

**Files changed (2026-10-26):**

- `src/components/dot-figure/model.ts`: the right-arm channels, additive `pose()`, `rib`, `breathe()`.
- `src/components/dot-figure/timeline.ts`: `HUNCH`, the new sequence, `yawAt`, `breathAt`, the sentence track, `END`.
- `src/components/home-intro/dotScene.ts`: the fixed framing (`FIXED`, `DROP`, `pullAt`, `seedOf`), the breath on the figure and the ring, the turns, the new ending (motto, ground line, reveal), `DOT_FLOOR` and `FIXED_LINE_Y` exported.
- `src/components/home-intro/HomeIntro.astro`: cues from `config/home-intro.ts`, the ground line and clip in every dots frame, the motto's markup and styles, one size for the cues, the `rest` rules.
- `src/config/home-intro.ts`: `cues` and `quotes`.
- `src/prototypes/home-intro/HomeIntroPreview.astro`: the dev bar's note only.
- Unchanged: every `ritual/` file and `config/ritual.ts` (its four cues stay for the old ritual and prototypes), `geometry.ts`, `render.ts`, `homepage.ts`, `scene.ts`.

**Verified (2026-10-26, Chrome, dev server unless noted):**

- Every phase scrubbed and screenshotted on `/dev/home-intro/#live`, and the timing read from the DOM every 10 ms: the hunch identical to `HUNCH` at every lag level until the straightening; each cue's in/out against the moves; the yaw at 45 and back to 70; the breath's in and out spans; the ring at 1.05 and back to 1; the line never hidden once drawn; the reveal.
- Layout, TR and EN, sampled every 100 ms through the whole scene in iframes at 1440 × 900, 1280 × 768, 1024 × 768, 360 × 640, 375 × 548, 390 × 664, 430 × 932, 740 × 360 and 568 × 320: ring sizes and the controls' position equal the earlier measurements (548/841, 416/705, 416/694, 269/520, 252/503, 294/545, 300/551, 222/281, 189/257); the controls never moved; the text slot kept one height per layout; no text past the screen's edges; no sideways scroll; the Instagram label on screen.
- `/` first visit in real time: `playing` → `rest` at 30.0 s; frames median 10.0 ms, worst 11.1 ms; no errors. `/en/` first visit: the same, the sentences in order (title 2.7 s, back 6.2, crown 12.0, breath in 19.5, out 23.5, motto 27.5). `/en/` second visit: the still end state with the line, the motto and the menu.
- The served HTML's line is at y 923.2 with the clip at 1923.2 (the no-script and reduced-motion still state).
- The `#opening` (TR) and `#idle` (EN) stills; no console errors.
- `npm run check` 0/0/0, 17/17; `npm run build` with `check-dist` clean; greps clean; neither page contains the removed chin cue.

**Not verified:** Safari and Firefox, real devices, VoiceOver, the system reduced-motion setting (no emulation run this time; the still state's markup and CSS were checked), the production build in a browser (only `npm run build` and its checks).

**Open questions for the owner:**

- **English cue drafts (unreviewed):** "Take a deep breath in." and "Breathe out slowly."
- **The crown cue's wording:** the owner's plan calls it "Başının tepesinden yukarı doğru uzan"; the approved cue, kept, is "Başının tepesinden yukarı uzan."
- **The motto's text:** the plan writes "Daha iyi duruş, Daha sağlıklı yaşam"; the approved slogan, kept (it is the page's `<h1>`), is "Daha iyi duruş, daha sağlıklı yaşam."
- **Interpretations made:** the 3 s hold runs from the title being fully shown to the straightening's start (the hunch is already still from 1600 ms, as the dots finish forming); the straightening takes the approved 5200 ms; the reach's arm is the figure's right (nearer the viewer at 45°); the lines (sparse connections) appear only over the held hunch and in the final front view, since every pose in between is moving or followed at once by another move.

### Visual corrections (2026-10-26, after review; built, uncommitted, approved by the owner after visual review)

The owner's "Refine Character Framing, Circle Scaling, and Movement", done in their order. The owner clarified that the ring need not keep one size: it may grow and shrink with her pose, and should be composed with her rather than her being fitted to a fixed ring, with no camera zoom. Cue wording and timing, the 3 s hold, the 3 s breath out, the sequence order, the motto, the menu reveal and the line's presence are unchanged; nothing in `ritual/` was touched.

**1. Placement and the ring** (`dotScene.ts`, "Her place and the ring's size"):

- `FIXED`, `DROP`, `WAIST`, `WAIST_UP`, `frameOpening`, `pullAt`, `lineAt` and the export `FIXED_LINE_Y` are gone. She keeps **one size and place** through the intro (no zoom): her **knees** (model height 47.5) on the line, her axis on the ring's centre.
- **The line never moves:** it is at `DOT_FLOOR` (stage y 923.2, where her feet stand with the menu) from the opening to the end. With the pull-back she shrinks to the menu's size and rises onto it. `HomeIntro.astro` puts every dots frame's line there.
- **The ring rests on the line and grows up from it:** size k (1 = the menu's ring), radius 460k, centre 923.2 − 423.2k. The menu's clearance (the figure inside 92% of the radius) is then a circle of radius 423.2k tangent to the line under her, so a shape's room is a single number: the largest (x² + h²)/2h over her dots above the line (h = height above the knees, dots within 10 units of the line left out). Measured at load from the figure (`roomOf`, `frameIntro`).
- **Her size:** the largest that keeps the raised hand in the ring at its largest, `RING_MAX = 1.03` (the ring's top then at stage y 13.5, inside the stage). Measured: **5.61 stage units per model unit** (was about 7.0 with the hips on the line; she is about 80% of that size, but knees to crown shows instead of hips to crown).
- **Ring sizes:** hunch **0.726**, standing **0.816**, reach **1.03**, menu 1. Timed, not tracking her outline: `ROOMS` in `timeline.ts`; each ease (`ease`) runs over the straightening (5200 ms from its start), over the arm going up (from the reach's start, 2235 ms, so the ring is at full size before the hand is over the head), and back over the arm coming down (from 300 ms after it starts, 1800 ms). The breath scales it ×1.05 about its own centre (`transform-origin` set to the centre each frame; `r` and `cy` set as attributes). With the pull-back it eases to 1.
- **Checked:** every 50 ms through the intro, every dot above the line stays within 0.935 of the ring's radius (worst at intro 15 400 ms, the arm starting down); 0.92 when still.
- **The opening:** the single dot and the dots' spread start at the hunch ring's centre (`seedOf`); `drawStill('opening')` sets the still's ring to the hunch's size.
- **Trade-off:** in the hunch and standing, the ring is smaller than the stage, which leaves open page above it, instead of a smaller figure or a zoom.

**2. Cues** (`HomeIntro.astro`, CSS only): in the stacked layouts (not the phone-landscape side column), the live title and cues are drawn `translate: 0 calc(-0.0768 * var(--ring))` higher (the line's distance from the stage's bottom). Measured: **16 px from the line to the text's box** at 1234 px wide (TR and EN) and at 375 × 667. The text slot, the controls and the motto keep their places (the motto stays 60 px under the line at 576 px).

**3. The reach** (`timeline.ts`):

- **New poses,** solved for joint places, a 2° upper-back lean away from the arm (`LEAN`, the head kept level):
  - `REACH_LOW` `shoulderR [-14, 133, 0]`, `elbowR [0, 99, 0]`: the elbow out at x −36, the forearm curving over the head, the fingertips over the crown at 182.
  - `REACH_HIGH` `shoulderR [-6, 168, 0]`, `elbowR [3, 38, 0]`: the arm long and soft, the elbow at x −20 (the head's side is at −7.6), the fingertips at 203.
  - Seen at 45°, the hand's top settles 2 units right of the head's centre (it was across towards the far ear).
- **One move up** through `REACH_LOW` (`armMove`, with a `via`), the old two moves' total time (4535 ms), so the crown cue and everything after keep their times. The two halves overlap (`VIA_BLEND` 0.2), so there's no dead stop.
- **Up:** the elbow starts to fold a beat before the shoulder, and the hand trails. Traced: the hand sweeps out to the side (x −46), arcs over and reaches the crown line, then rises straight up and never crosses past it. An earlier try with the elbow lagging made the hand rise, drop and rise again; it was rejected.
- **Down:** the shoulder leads, the elbow lags with an extra 30° bend mid-move, and the forearm and hand unfold last.
- Per-move `spread` is a number (the spine's cascade) or an `ArmMotion`.

**4. The breath** (`model.ts` `breathe()` plus `BREATH_POSE` in `timeline.ts`):

- **The upper body rises 0.9 units as one.** The new per-dot `lift` covers the arms, neck and head whole, and the trunk fading in above the waist (98 to 126).
- **Within it the rib cage opens.**
  - The lower ribs widen by 5% of their half-width; this fades out above 122, so the sides under the arms stay still.
  - The chest and upper belly come forward by 12% of their half-depth, the back by 3%.
  - The band is 100–136, with soft edges.
  - The old 26% widening and the 2.4-unit lift of the rib band alone are gone.
- **On the skeleton,** with the follow-through: the upper back extends 1.5° over T12–T2, the neck and head take it back, and the arms open 0.8°.
- **The breath out** runs everything back on the same 3 s curve as the ring (5% unchanged).

**Timing, read in Chrome:** `sentenceTrack` is exactly as before: in/out 0/3000, 3550/8785, 9335/14 905, 16 840/20 290, 20 840/–. `END` 24 290, `IDLE_AT` 26 440, `OPENING` 2500; the scene stays 29 990 ms.

**Verified:**

- Chrome, TR and EN `/dev/home-intro/#live` scrubbed and screenshotted at the opening, the hunch, the straightening, the reach (several frames), the lowering, the breath (rest vs full), the motto and the menu; the `#opening` still.
- `/` at 1280 × 723 and `/en/` played through in real time to the menu, with no console errors once tracking started.
- Iframes at 375 × 667 (phone portrait) and 812 × 375 (side column, cues not moved), plus a 500 × 490 window (side column). The ring's top stays under the header at its largest everywhere checked.
- `npm run check` 0/0/0, 17/17; `npm run build` with `check-dist` clean; the dev-only and old-ritual greps on `dist` find nothing.
- **Not repeated this time:** the full 100 ms layout sweep at the nine earlier sizes, Safari, Firefox, real devices, VoiceOver.

**Reach correction (2026-10-26, the owner's narrowly scoped request; `timeline.ts` only).** In scene time on the dev slider:

- **At 14 610 ms the hand touches the top of the head.** A new `REACH_TOUCH` pose replaces `REACH_LOW`: the hand rests across the crown with the wrist bent onto it. Measured: the hand's lowest dots at 172.1 against the head's top at 170.6, 2.17 units from the head's dots, about the head dots' own spacing of 2.66, so touching but not inside.
- **From there it lengthens upward without a stop** and reaches `REACH_TOP` at 17 000 ms. `REACH_TOP` is the pose the arm passed through at 14 610 ms before this change: top 197.3 and lowest dots 184.4 now, against 197.0 and 184.5 measured before.
- **The rise is smooth.** It was sampled every 50 ms, from 175.5 to 197.3 on an ease-in, ease-out curve, at most 0.9 units per 50 ms. There's one 0.1-unit settle just after the touch, and no other reversal.
- **On the way to the crown** the hand never comes closer than 2.47 units to the head.
- **How:**
  - The arm's move through `via` now follows a monotone cubic curve per channel (`through`). It passes exactly through the touch pose; the shoulder keeps moving through it, while the elbow and wrist turn back there.
  - `delay` becomes a mid-segment trail (`trail`).
  - The skeleton's knots are 1.5 × LAG earlier than the target times, because the hand's dots trail by one or two lag levels.
- **Unchanged:**
  - The arm comes down at the same time as before (`LOWER_AT`, scene 17 405), so the hold at the top is now about 400 ms instead of 900.
  - `sentenceTrack`, `END` (24 290), `IDLE_AT` and the 29 990 ms scene are identical.
  - The ring and her size are still measured on the former top pose (`REACH_ROOM`), so the circle behaves exactly as before.
- **Checks:** `npm run check` 0/0/0, contrast 17/17. `npm run build` passes with `check-dist` clean, and the dev-only grep finds nothing. The homepage script is 22 685 B raw, 10 252 B `gzip -9`.

**Circle update (2026-10-26, the owner's final scoped request; `dotScene.ts` and `timeline.ts`).** Poses, hand positions, the reach's path, all timings, the motto, the menu, the text and the line are unchanged. Re-measured: the hand at 14 610 is still 175.5 top / 172.1 low / 2.17 from the head; at 17 000 it is still 197.3 / 184.4 / 18.43; `sentenceTrack` and `END` are identical; the scene is 29 990 ms.

- **Through the reach the circle follows the arm.**
  - `frameReach`, measured once per page: the room the arm needs is sampled from the drawn dots every 100 ms over `REACH_SPAN` (from the arm leaving her side to its last dots back down, intro 9335–17 140).
  - That curve is shaped to rise once and fall once, widened ±250 ms (`REACH_LEAD`) and then averaged over the same window. The result is never smaller than the need at any moment and is slightly early.
  - `ringAt` takes the larger of this and the timed sizes.
  - Still grounded: the circle rests on the line and grows up from it. Her size is unchanged, still measured on the former top pose, now through `SIZE_SHAPE`.
  - `ROOMS` keeps only the straightening. The reach and lowering keyframes are gone.
- **Measured** (scene time, size 1 = the menu's circle):

  | Moment | Circle size |
  |---|---|
  | Standing | 0.816 |
  | Hand arcing over the head (13 500) | 0.944 |
  | Hand on the crown (to about 15 500) | 0.950 |
  | Hand at its highest (17 000) | 0.994 |
  | Back to standing (by about 19 000) | 0.816 |

  - Sampled every 20 ms, the size changes by at most 0.005 per step, with no steps where the reach starts and ends.
  - Sampled every 50 ms over the whole intro, the dots never come closer than 0.924 of the radius (at 17 700, the arm starting down).
- **Breath:** `RING_BREATH` 0.05 → **0.12**, on the same curve as the body. The circle reaches 1.12 at the full inhale (22 790) and is back to 1.00 at 26 790, after the 3 s exhale.
- **Checks:** Chrome, the Turkish dev preview: reach and both breathing cues scrubbed and screenshotted. `npm run check` 0/0/0, contrast 17/17. `npm run build` passes, `check-dist` is clean (`/`, `/en/`, `/404.html`), and the dev-only and old-ritual greps find nothing. Nothing is committed, pushed or deployed; `ritual/` is untouched.

### Replay in the coming-soon line's place (2026-10-26, built, uncommitted, approved by the owner after visual review)

The owner's scoped request: remove the coming-soon line, and put a Replay button exactly where it was. The animation, the cue timings, the 29 990 ms scene, the circle, the poses, the menu items and `ritual/` are unchanged.

- **Markup** (`HomeIntro.astro`): the `<p data-intro-soon>` is replaced, in every frame, by the existing `data-intro-replay` button and its hidden description. The button moved out of `.intro__controls`, which now holds only the stop control; its place is kept when the stop control is hidden, so nothing moves.
- **Style:** `.intro__replay` uses the stop control's look: Inter 500, `--text-small`, muted, underline on hover. It keeps the old line's 1.6 line height. Negative block margins give back what the 44 px tap target adds, so the label sits on the old line's text line, and the text slot (80 / 96 / 101–112 px) and the controls keep their sizes.
- **Timing** (`dotScene.ts`): Replay fades in on the coming-soon line's old span (`REPLAY_IN`, reveal end + 300 ms, 450 ms). The stop control now fades out over that same span (was `CONTROLS_SWAP`, 300 ms earlier), so the two still hand over in one frame and focus can pass between them. The scene's duration is the same formula, unchanged.
- **Playback** (`homepage.ts`): the same `scene.replay()` path as before, with no new animation code. The 700 ms double-click guard (`GUARD`, `hiddenAt`) is removed: it was needed only while Replay appeared under the stop control.
- **Copy** (`config/home-intro.ts`): `comingSoon` is removed. English `replay` is "Watch again" → **"Replay"**. Turkish "Yeniden izle" and both `replayLabel` descriptions are unchanged.
- **`scene.ts`** (the dormant character version, only if `FIGURE = 'character'` in the dev preview): the soon element is now optional, so it doesn't crash; nothing else changed.
- **Verified** (Chrome, dev server, 937 × 830):
  - `/` first visit: `rest` at the end, Replay under the motto.
  - Replay: restarts from the single dot, focus on the stop control.
  - Stop mid-reach: focus on Instagram, and no frames requested afterwards.
  - Double-click on Replay: one playback, `rest` about 30.0 s later, focus handed from the stop control to Replay.
  - `/en/`: "Replay", described as "Replay the intro animation"; it restarts from the opening and reaches `rest` about 30.0 s later.
  - At most one pending animation frame throughout; no console errors.
  - In iframes at 1440 × 900, 375 × 548, 360 × 640, 390 × 664, 740 × 360 and 568 × 320, the rings and the controls' top equal the earlier tables, with no sideways scroll.
  - The dev preview's three frames render.
- **Checks:** `npm run check` 0/0/0, contrast 17/17. `npm run build` with `check-dist` clean; the dev-only, old-ritual and coming-soon greps on `dist` find nothing. The script is 23 223 B raw, 10 429 B `gzip -9`.
- **Not done:** the dev preview's in-frame Replay stays unwired, as before (its dev bar replays). Not checked: Safari, Firefox, real devices, VoiceOver.
- **Supersedes:** the step-10 notes' "the coming-soon line", "Replay takes the stop control's place" and the double-click guard, and "Watch again" in step 11's accessibility notes.

## Posture prototype (dev only, in progress as of 2026-10-20)

An isolated visual-direction experiment for a character-led, posture-awareness homepage. It is **not** the site design yet. Nothing about it is committed, pushed or deployed; keep it that way unless the owner explicitly asks.

**URLs** (`astro dev` only, http://localhost:4321):

- `/dev/posture/` (Turkish) and `/en/dev/posture/` (English): the prototype page, whose hero still uses the original `Figure.astro`.
- `/dev/posture-sheet/` (male character) and `/dev/posture-sheet-female/` (female character), and the same under `/en/`: temporary character sheets. A pill switch under the intro links the two characters; the header links to the other language of the same character.
- `/dev/posture-intro/#play` (Turkish) and `/en/dev/posture-intro/#play` (English): the intro ritual's development harness. See "Posture intro ritual" below.

**Files** (all untracked; the only change outside them is the three character colour tokens, see below):

- `src/pages/dev/[prototype].astro`, `src/pages/en/dev/[prototype].astro`: dev-only routes. `getStaticPaths()` returns `posture`, `posture-sheet`, `posture-sheet-female` and `posture-intro` only when `import.meta.env.DEV`, and the components are imported only behind `import.meta.env.DEV` (separate `Sheet`, `Prototype` and `Intro` variables, so each gets its own props). Keep both guards: with a plain static import, `astro build` emitted an unreferenced `dist/_astro/PosturePrototype.*.css` even though no page was built (`check-dist` does not catch that). After changes, run `npm run build` and confirm `grep -rlE 'posture|prototype|fig-stack|orbit__|sheet__|Character|band--|j-pelvis|arm-outline|clipPath|suit|hair-|line-closed|female' dist` finds nothing.
- `src/prototypes/posture/PosturePrototype.astro`: the whole page (own `<html>`, `noindex`, own header/footer; reuses `fonts.css`, `tokens.css`, `global.css`, `InstagramLink`, `DevPlaceholder`). Sections: hero (motto split around the figure, circular nav), Pilates, Posture (labelled alignment diagram), Movement (one-minute posture break), Community (Instagram band).
- `src/prototypes/posture/Figure.astro`: the hero's original side-profile articulated figure in SVG, with its CSS-only roll-up load animation, hover poses and reduced-motion fallback. **Unchanged since 2026-10-19 and not connected to the new characters**; it imports only a type from `copy.ts`.
- `src/prototypes/posture/copy.ts`: TR/EN draft copy, including the sheet's (`sheet`) and `sheetPaths` (per character and language). All of it is unreviewed draft and needs editorial review before any production use; no sources, credentials or health claims.

**Characters (fourth revision, from the owner's reference images, awaiting the owner's visual approval):** the owner supplied two reference sheets, `../reference_assets/erkek_karakter_referans.png` (male) and `../reference_assets/kadın_karakter_referans.png` (female), outside the repository, as the primary visual source; they supersede the earlier gender-neutral brief. Both are flat 2D figures in natural skin with thin outlines, closed calm eyes, short dark brown side-swept hair (male: short with a fringe; female: ear-length bob with a side fringe) and a dark, sleeveless, mid-thigh one-piece cycling suit (a tank with armholes; the shoulders are bare). The hero still uses the original `Figure.astro`; the new characters appear only on the character sheets and in the intro ritual's harness. **The owner approved the character artwork, together with the intro animation built on it, on 2026-10-20** (see "Posture intro ritual" below). Don't change either without the owner's instruction.

- **Character colour tokens**, all in `tokens.css` and listed in `APPROVED` and `DECORATIVE` in `check-contrast.mjs`: `--color-skin: #d8b49e` and `--color-skin-shade: #c49a82` (approved by the owner on 2026-10-19; the reference sheets name the same two values) and `--color-hair: #583c2c` (approved by the owner on 2026-10-20: the references' dark brown, sampled from both sheets). Being in `tokens.css`, all three also appear in the production CSS (as declarations only). Hair is a single `--color-hair` fill (with a thin stroke in the same colour to close the seam against the skin); it replaced the earlier three-layer approximation of approved tokens (about `#594034`). Brows: `--color-hair` for both; the male's get an extra `--color-text` layer at 40% (about `#443126`), because his reference brows are darker (about `#442818`), while the female's match her hair (about `#583c30`). The suit is `--color-muted` (references: about `#645448`).
- `src/prototypes/posture/proportions.ts`: what both characters share, in one 300 × 460 viewBox: the eight-head grid (U = 50 units, `TOP`, `FLOOR`, `CX`), `CharacterId`, the joint heights in `y` (shoulder, elbow, hip, wrist, knee, ankle, measured from the references, which agree to within a unit or two), the pelvis extent, the spinal segments (`spine`: id, region and lower edge, bottom up) and the head pivot. The 3D skeleton for the turn (step 3 below) is deliberately not implemented.
- `src/prototypes/posture/characters/`: the two designs. `index.ts` defines `Design` and exports `designs`. `male.ts` and `female.ts` hold, per view, the contours as `[y, x]` keys (front: torso half-width, the figure's right arm and leg; side: back and front of the torso and neck, the arm, the leg), the joint pivots, the crotch and hem heights, the suit's top edge (front: armhole, strap and neckline; side: the neckline) and small details (kneecap, ankle bone, crotch line); plus the chin and fingertip heights for the sheet's labels. The keys were measured row by row from each reference's full-figure views; parts hidden there (the side of the torso under the arms, the tops of the thighs under the pelvis, the back behind the arm) are drawn plausibly so nothing is missing when a joint turns. `male-paths.ts` and `female-paths.ts` hold the path data **traced** from the references and simplified: hair, face, ears, brows and eyes from the face close-ups (fitted by scale and offset onto the full-figure views), side-view hands and both feet from the full-figure views; the front-view hands, nose, mouth, ear details, collarbones and jaw shadow are placed by hand over the references. Two traced edges were then corrected by hand (2026-10-20): the female side face's underside, which now runs from the chin in one smooth curve into the neck's front contour, meeting it at the neck key at y 92 with the same slope; and both jaw shadows, which stay inside the neck: the male front one spans exactly between the neck's outlines (it stuck out on his right), the female side one ends just behind the neck's front line. If a neck contour or the face is changed, recheck these two junctions at high zoom. The tracing scripts were one-off tools (numpy + Pillow, kept outside the repo); to change a traced shape, edit its path or redraw it.
- `src/prototypes/posture/body.ts`: builds the SVG markup for a character and view (`characterMarkup(id, view, mode)`); also exports `sideLayout(id)` (segment and region extents for the sheet's labels) and `proportionsOf(id, unit)` (measured shoulder, waist and hip widths). Outlines are smooth curves (cubic Hermite through the keys) sampled every 2 units. Joint tree, each a `<g class="j j-*">` with its pivot as `transform-origin` (viewBox units, needs `transform-box: view-box`), no transforms in the neutral pose: legs `hip → knee → ankle` (drawn first, behind the pelvis; the right leg and, from the front, the right arm are mirror images of the left); `pelvis` (pivots on the hip joints) → `l5-l4 → l3-l2 → l1 → t12-t10 → t9-t7 → t6-t4 → t3-t1 → c7-c5 → c4-c3 → c2-c1 → head`, with the arms (`shoulder → elbow → wrist`) on `t3-t1`, drawn after the rest of the chain so they stay in front. Each spinal segment is the torso slice between two heights, pivoting at its lower edge on the spine's curve (side view: a set depth between back and front, `spineDepth`) or on the centre line (front); in the figure each slice reaches 4 units below its edge, under the segment beneath. Limbs are sliced the same way: each part overlaps the next at the joint and is drawn after it, so the cut edges are hidden (the hand and foot are drawn first in their joints); an elbow disc fills the bend. **Suit:** a separate layer on the same segments: the pelvis, each spinal segment and each thigh draws its own suit piece right after its skin, so it bends with the body and no skin shows between segments. `geometry()` builds each view's suit area (its top edge from the design, open far downwards and sideways); segments above the area's `fullBelow` clip it to their own outline with a `<clipPath>`. Ids get a per-render prefix because a sheet shows the character many times. The arms are plain skin over the torso, coming out of the armholes, so there is no shoulder-cap logic any more. **Outlines** follow the references: open strokes along each slice's two sides only (never across a cut edge), in skin shade, repeated in the suit-line colour inside a clip of the suit area; the suit's own edges (neckline, armholes) are stroked inside each segment's clip; closed shapes (face, ears, hands, feet) use `paint-order: stroke`, so only the outer half of their outline shows. Head layers: jaw shadow, (front) ears, face, hair, (side) ear, features; the brows are two `<use>` copies of one path in `<defs>` (the second, darker one is hidden for the female by `.ch--female` in `Character.astro`). Segment outlines (`edge`), pivots and the dashed spine marks are drawn but shown only in the diagrams.
- `src/prototypes/posture/Character.astro`: thin wrapper (`character`, `view`, `mode`) that renders that markup as a `<g class="ch ch--{mode} ch--{view} ch--{character}">` (`set:html`, so its styles use `:global()` under `.ch`). Modes: `figure`; `construction` (segments outlined, alternating skin/skin-shade and suit tones, pivots, the dashed spine in the side view; the arms are hidden from the side only, as in the references); `regions` (pelvis/lumbar/thoracic/cervical in muted ink, terracotta, sage and ink; arms hidden, limbs and head faded).
- `src/prototypes/posture/CharacterSheet.astro`: the temporary review page, with `lang` and `character`. Sections: character switch; front and side on one head-unit grid (8 at the top, as in the references) with landmark lines (chin and fingertips per character), centre and plumb lines; torso and spine close-ups (front construction with the arms, side construction with segment labels on leader lines, side regions); the neutral standing pose (front, as in the references) in the hero's ring and disc; face close-ups; proportions (a small front figure and the measured widths, in heads, locale-formatted); notes and the references' review questions. The page, its blocks and the pair grid use single `minmax(0, 1fr)` columns, so at phone width only the grid view scrolls sideways, inside its own box. Delete the sheet, its `posture-sheet*` paths and its copy once the characters are approved.

**Current state:** `npm run check` and `npm run build` pass; production output contains nothing from the prototype. No client-side JavaScript, except the intro ritual's harness and player (dev only). Only approved colour tokens. The Instagram CTA links to the real profile now that `instagramHandle` is set.

**Session status (end of 2026-10-20):**

- **Done:** both characters recreated from the reference images on the existing articulated structure (pelvis, 3 lumbar, 4 thoracic and 3 cervical segments, head; shoulders, elbows, wrists; hips, knees, ankles), with the suit as a per-segment layer; male and female sheets in Turkish and English with a switch between them; the phone-width overflow of the old sheet fixed.
- **Superseded later on 2026-10-20:** the characters and the intro animation are now approved (see "Posture intro ritual" below). The "NOT approved yet" status that stood here and the "Next session" plan at the end of this list are history; the current next step is in that section.
- **Hair token (2026-10-20, second pass):** `--color-hair` added and used for the hair and brows of both characters, on all four sheet routes (computed fill `rgb(88, 60, 44)` on every hair instance; the male and female face close-ups compared visually in Chrome against the references). Nothing else about the characters changed.
- **Validation (2026-10-20, after the hair token):** `npm run check`: 0 errors, 0 warnings, 0 hints; `check-contrast`: all 17 pairs pass, with `--color-hair` listed as decorative. `npm run build`: `check-dist` clean, and the grep above finds nothing in `dist` (the only character-related production output is the three character token declarations). All six dev routes return 200. `Figure.astro` and `PosturePrototype.astro` are byte-identical to before (SHA-1 `a026e29…` and `6ef3d94…`). Compared in Chrome against both reference images at about 1400px: front and side views, heads and face close-ups, construction diagrams, neutral pose. At 390px (in iframes), both sheets: the document is 390px wide with no sideways scroll; the grid view scrolls inside its box. Articulation was tested only by temporary in-browser rotations, not saved: every spinal joint 8° forward (side) and −6° sideways (front), plus the shoulders, elbows, head, hip and knee.
- **Known differences from the references:**
  - The suit's muted ink is a touch greyer than the references.
  - The references' soft shading (on the arms, legs and neck) is reduced to a jaw shadow and a few fine lines; outlines are a uniform skin shade rather than the references' slightly darker, varying line.
  - The front-view hands are drawn to measure, simpler than the references' (thumb and fingers as one shape with a single dividing line); the side-view hand keeps the reference's straight thumb edge.
  - The references' spine-regions panel (a separate column of vertebrae) is replaced by the existing torso coloured by region; the front and side views in the references differ slightly in hem height, and each view follows its own reference.
  - Small tracing artefacts: a tiny tick at the top of each side-view ear and at the outer end of the female's left brow.
- **Known limitations:**
  - Spinal bending: no gaps or exposed skin in the suit, but small steps along the outline at each segment joint, and a tiny suit spike near the neck on strong bends, where each segment's hidden 4-unit overlap pokes out (rounded overlaps centred on each pivot should fix it). Front-view segments meet on straight horizontal cuts.
  - The arms ride on `t3-t1`, so in a bend they swing with the rib cage instead of hanging; coordinating them is animation work.
  - Limb articulation is rough: a raised arm shows the flat top of the upper arm (no rounded shoulder cap), a bent elbow or knee leaves a small notch, and a flexed hip shows the flat bottom of the pelvis behind the thigh.
  - The female's side-view suit reaches up behind the arm to the strap (correct when the arm hangs; with the arm raised, the back shows suit up to the neckline). The side view has no far arm, and the far leg sits exactly behind the near one.
  - Each sheet is about 550 KB of HTML in dev, because the character is inlined eight times; fine for a dev page, not a production approach.
- **Next session, in order:** (1) the owner reviews `/dev/posture-sheet/` and `/dev/posture-sheet-female/`; (2) make only the visual corrections they request and get explicit approval; (3) only then plan the spinal roll-up animation (propose the approach and scope before building it, per the working rules), including rounded segment overlaps, a shoulder cap and how the arms and head stay coordinated during the roll, and decide whether the hero gets one of the new characters.

**Known limitations of the first version:** flat side-view figure only; arms clip the head in the arms-overhead pose; hover poses run only at ≥1024px with hover; the desktop ring layout was checked visually at 1440px only (1024–1200px is unverified); the English motto halves are unbalanced ("Better posture." wraps, "Better health." doesn't); on phones the section list starts below the fold.

**Next steps (requested by the owner; build after re-confirming scope, per the working rules):**

1. Keep the SVG + CSS character. Do NOT switch to a real 3D model or add a 3D library.
2. Redesign the character to be more detailed, anatomically readable and gender-neutral, keeping it stylized and approachable. (Superseded on 2026-10-20 by the owner's male and female reference sheets; see above.)
3. Explore a full 360-degree turn with the existing 2D/SVG approach, if feasible without it looking like a flat card rotating in space. If a convincing turn isn't feasible, document the limitation here and propose alternatives, without implementing a real 3D model.
4. Animate a controlled spinal roll-up from a slouched position into an upright idle pose.
5. Idle pose: the character seen from the front, arms relaxed and slightly separated from the torso, long hands, palms facing forward.
6. Add a subtle visual of the character's movement range, inspired by the proportions and geometry of Vitruvian Man, without copying the artwork.
7. Once the idle pose is reached, automatically highlight one navigation section every 3 seconds (pose change, scale, weight or colour). Any user interaction takes control and stops the automatic cycle.
8. Keep the prototype isolated from the existing website. Do not commit, push or deploy.

Constraints that still apply to these steps: existing working rules (no new dependencies without approval, no invented claims), approved colour tokens only (`check-contrast` scans `.astro`/`.css` in `src/`), reduced motion respected. The automatic highlight cycle will likely need a small client script (stopping it on interaction is a feature that needs JS); it should also not run under `prefers-reduced-motion`, since auto-moving content needs a way to stop (WCAG 2.2.2).

## Posture intro ritual (dev only, approved 2026-10-20)

A 16-second guided posture intro: the two characters side by side, the male seen from the front and the female from the side facing right, moving in sync from a slouch to the approved neutral pose and taking one deep breath, while one sentence at a time appears beside them. **The owner approved the current animation and the character artwork on 2026-10-20. Don't change either (timing, poses, amplitudes, artwork, paths, proportions, copy) without the owner's instruction.** It exists only in a dev harness; it is not on the homepage or the prototype page, and nothing about it is committed, pushed or deployed.

**Preview URLs** (`astro dev` only): `/dev/posture-intro/#play` (Turkish) and `/en/dev/posture-intro/#play` (English). `#play` is the live preview. It plays once on load and has dev controls: replay, pause/resume, speed (1×, 0.5×, 0.25×), a time scrubber and an ms readout. Below it are still frames for comparison: `#start` (slouched first frame), `#end` (neutral last frame), `#static` (reduced-motion version) and `#cues` (every sentence in the cue line). `?motion=reduce` forces the reduced-motion version. `window.__ritual` (`player`, `poseAt`, `transformsAt`, `sentenceOpacity`, `DURATION`) is exposed for console checks.

**Files** (all untracked, in `src/prototypes/posture/` unless noted):

- `IntroHarness.astro`: the harness page (own `<html>`, `noindex`), rendered by the `posture-intro` dev route in `src/pages/dev/[prototype].astro` and `src/pages/en/dev/[prototype].astro`. Its first inline script sets `data-intro` (and `data-motion='reduce'` for `?motion=reduce`) before first paint; its module script creates the player and wires the controls.
- `IntroRitual.astro`: the ritual itself, with variants `live` (driven by the player), `animated` and `static` (still frames). It renders both characters through `Character.astro` in one viewBox (`GAP` 100 units). It also emits the slouched start as CSS rules, from the same `transformsAt(…, 0)` the player uses, so the slouch shows before the player's first frame.
- `intro/timeline.ts`: `DURATION`, the movement track per joint (`motionTrack`), the male's crown lift (`crownTrack`), the breath (`breathTrack(y)`, `breathLag(y)`) and the sentence timings (`sentenceTrack`, `SENTENCE_FADE` 450 ms). The movement and the sentences are separate tracks.
- `intro/poses.ts`: the views (`male: 'front'`, `female: 'side'`), the slouched start as side-view joint angles (`slouched`, about 78% of the first proposal, at most 5.5° per joint), the arm's hanging rule, `CROWN_LIFT` (3 units) and the breath's height profile (`breathProfile`, `expansionAt`, `smoothstep`).
- `intro/frontPose.ts`: turns the side view's angles into the front view's pose. Forward rotations would bend a front view sideways, so it measures, on the male's side-view pivots, how far the shoulders and the head's pivot sink and how far the head tips. The front view's joint groups then move down by those amounts, the shoulders a little inwards, and the head is foreshortened by the cosine of its tilt. In the slouch: 3.7 units at the shoulders, 9.2 at the head's pivot, 28° (head scaleY 0.88). Nothing is redrawn.
- `intro/pose.ts`: pure functions of time: `poseAt` (side-view angles), `transformsAt` (each joint's rotate/translate/scale for the character's own view; empty from `DURATION` on), `breathWidening(view, y, t)`, `sentenceOpacity`, `cssOf` and the easings. These are a slow-in, long-settle `ease` for the movement and a symmetric `breathEase` for the breath.
- `intro/controller.ts`: `createPlayer(root)`. One `requestAnimationFrame` clock (with a 50 ms maximum step) applies the joint transforms as inline styles, the sentence opacities and the breath's outline bending each frame. The player only touches elements inside its root.
- `copy.ts` (`ritual`): the title, cues, skip label, figure labels and harness text, TR and EN.

**Timeline** (ms; 16 000 in total):

- Sentences, one on screen at a time, each fading in and out over 450 ms with no overlap:
  - 0–1250: title "Hatırla ve tekrarla." (lowercase t)
  - 1800–3450: "Sırtını yavaşça düzelt."
  - 4000–5850: "Başının tepesinden yukarı uzan."
  - 6400–7850: "Çeneni hafifçe içeri al."
  - 8400 to the end: "Burnundan nefes al, ağzından ver.", on screen for the whole breath.
- English versions: "Remember and repeat.", "Slowly straighten your back.", "Reach up through the crown of your head.", "Gently tuck your chin.", "Breathe in through your nose, out through your mouth." They are Claude's drafts, unreviewed (the harness shows a draft note). The Turkish copy is the owner's.
- Movement:
  - 0–1900: the slouch is held while the title is read.
  - 1900–4290: the back straightens from the pelvis up, each segment 130–150 ms after the one below.
  - 3950–6100: the neck straightens and the head lifts to just above level (−2°). From the front, the male's crown rises 3 units at the same time (the top of the neck and the head translate up, so the neck lengthens).
  - 6450–8050: the chin tucks with a slight nod that settles, and the male's crown returns to neutral.
  - The arms hang straight, following the rib cage 45 ms late.
- Breath:
  - Inhale 8700–11500 (2.8 s), pause 11500–12200 (0.7 s), exhale 12200–15600 (3.4 s), all with the symmetric breath ease.
  - Then 15600–16000 still, in the exact approved neutral pose (no inline transforms, original path data).

**Breathing: smooth torso-outline morphing.** The torso isn't widened segment by segment, which left stepped outlines at the segment joins. Instead, during the breath the player bends the torso's actual path data, point by point:

- **The formula:** each point moves to `x' = s(y) + (x − s(y)) · (1 + breathWidening(view, y, t))`. `s(y)` is the spine at the point's height, read from the torso's and neck's joint pivots: the centre line (x 150) from the front, the spine's curve from the side. Since the amount depends only on height, overlapping segments move together and stay joined.
- **Which paths:** the torso segments below the neck (`l5-l4` … `t3-t1`): each segment's skin, suit and suit edges, its suit clip, its outlines in skin and suit colour, and the shared suit-area clip. That is 38 paths for the male, 31 for the female. Not the arms, head, neck, pelvis, legs or the hidden diagram marks.
- **Profile** (`breathProfile`): front 12% of width, rising over heights 118–160, full to 178, falling to nothing at 206. Side 10% of depth, rising 112–145, full to 175, falling to nothing at 206. It is exactly 0 above and below, so the shoulders, neck and pelvis meet the bent outlines exactly.
- **Lower ribs first:** `breathLag(y)` is a smoothstep from 0 ms at the lower ribs (y 172) to 450 ms at the top of the rib cage (y 124) and above. All heights reach full together and release together.
- **Restoring the artwork:** where the widening is 0, a point keeps its original text. A path with no widening gets its original `d` string back exactly, so outside the breath and at the end the markup is byte-identical to the approved artwork.
- **Side view's chest lift:** the side view also lifts the upper rib cage with the breath (−0.5° on `t9-t7`, `t6-t4` and `t3-t1`, with the same lags), and `c7-c5` undoes it (+1.5°) so her head stays level. The front view leaves this lift out (`spineAt(…, breath = false)`). From the front it would only raise the rib cage and shoulders by sub-unit amounts, and those offsets caused hairline anti-aliasing seams at the suit's clipped edges.
- **Measured at the top of the breath** (desktop, 1.33 px per unit):
  - The male's gap between arm and waist closes from 3.0 to 0.2 units at y 176, and from 4.5 to 0.9 at y 180.
  - The female's chest comes forward up to 3.9 units (5.25 px).
  - The male's arms and head don't move. The female's head drifts back 1.2 px with the chest lift.
- **Removed:** the per-segment `scaleX` breathing (and its arm and neck counter-scales) no longer exists.

**Reduced motion** (`prefers-reduced-motion: reduce` or `?motion=reduce`): no movement. The figures stand in the approved neutral pose, with the title and all four cues shown together as a list. The harness controls are disabled with a note. If scripting is off, or the player hasn't started within 3 s, the live frame shows the same static version. The changing cues count as auto-updating content under WCAG 2.2.2; the harness has pause and speed controls, but the eventual integration still needs its own pause/timing answer.

**Not built yet** (each needs the owner's instruction first): the visible "Geç"/"Skip" button does nothing, and the harness says so. Also not built: Escape to skip, an exit transition, session memory (once per tab), and any hand-off to the hero. Earlier decisions from the first brief (5 s version), to re-confirm with the owner rather than assume: never dismiss on arbitrary pointer, touch or key presses, because visitors follow along; skip only with the button or Escape; show it once per browser tab where it is integrated, with replay always allowed in the harness; the hero's own roll-up (`Figure.astro`) should start after the intro ends.

**Validation completed (2026-10-20, final state):**

- **Path restoration:** the live frame's path data is byte-identical to the server-rendered HTML at 0, 8000, 8700, 15600 and 16000 ms, after scrubbing back, at the end of a real-time playthrough, and in the phone-size frames.
- **Join alignment:** checked every 100 ms through the breath, on screen with the joint transforms included, for skin, suit and outlines. Male maximum mismatch 0 units; female 0.037 units (0.05 px), from her existing chest-lift rotation.
- **Real-time playthrough:** 16.0 s. The breath cue stays at full opacity from 8850 ms to the end, and there are 0 inline transforms at the end.
- **Performance:** frame times are the same during the breath as outside it (median 10 ms, worst 11.1 ms), and a breath frame costs about 0.4 ms to apply.
- **Chrome views:**
  - Desktop at normal size: rest, mid-inhale, peak and mid-exhale.
  - 6× close-ups: smooth outlines.
  - Turkish and English.
  - Phone portrait 390×844 and landscape 560×390, in same-origin iframes: no sideways scroll.
  - Reduced motion.
- **Checks:** `npm run check` (0 errors, 0 warnings, 0 hints; all 17 contrast pairs pass) and `npm run build` (`check-dist` clean, and the prototype grep above finds nothing in `dist`).

**Limitations:**

- **Browsers:** visual testing was done only in Chrome on macOS (desktop viewports about 993–1634 px wide, and phone sizes simulated in iframes). Safari, Firefox and real phones are untested; Safari's handling of per-frame `clipPath` path updates is the main unknown.
- **Overlap at the joins:** each spinal segment still overlaps the next by 4 hidden units. The female's small chest-lift rotation leaves a mismatch of about 0.04 units there, invisible at normal size.
- **Female head:** it drifts 1.2 px backward during the breath.

**Next step:** in the next session, the owner will explain in detail how they want to use and position this intro on the existing homepage. Listen first and make sure the requirements are understood (ask about anything unclear), then agree the plan before making any integration changes. Until then:
- Don't integrate the intro into the homepage or the prototype page.
- Don't touch the production homepage.
- Don't change the approved animation or artwork.
- Don't stage, commit, push or deploy.

*Superseded (2026-10-25):* this two-character ritual was later integrated into the uncommitted homepage (`ComingSoon.astro` → `WelcomeRitual.astro`). It was then replaced there by the dot-figure homepage intro (plan step 10, "Dot figure in the homepage intro" above). It is on no built page; its files stay on disk unchanged.
