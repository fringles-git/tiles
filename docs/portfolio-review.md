# Tiles portfolio: source review and decisions

Reviewed 2026-11-06. Base: fringles-git/tiles at 90b749ee82649f3028ecf430b798d10e68e3531e.
Reference: fringles-git/tiles-aistudio main, inspected during this review.

## Evidence and limits

Repository source was read through GitHub. The local execution environment was unavailable.
The public URL returned HTTP 200 through Firecrawl and its text was retrieved.
A screenshot URL was returned, but could not be saved and visually inspected; browser interaction timed out.
Consequently this is a source review and feature assessment, not a completed visual, mobile, accessibility or performance audit.
No authenticated analytics or admin session was accessed.

## What is already built

Tiles already provides a modular grid, sizes and reordering, sections, profile/contact/CV,
themes and typography, image/gallery/project cards, Spotify and YouTube support,
booking links, testimonials, external product and tip links, signup forms, aggregate views and clicks.
Do not rebuild these as new features. Existing product/tip blocks point to external services;
they are not a native checkout. Stats are raw event counts, not unique people or attributed conversions.

## Decisions

| Reference idea | Decision | Reason / implementation |
| --- | --- | --- |
| Bento grid and magazine hierarchy | Keep and refine | Existing identity; feature fewer strong projects before hobbies. Visual verification pending. |
| Richer project evidence | Add now | Optional need / contribution / verified outcome fields and native dialog; no fabricated results. |
| Semantic photo rendering from AI Studio | Adapt now | Photos and project covers use escaped img elements, alt text, lazy loading and async decoding. No duplicate CSS background fetch for real images. |
| Upload feedback | Next | Valuable for editing on tablet; implement with explicit retry and per-file error handling. |
| Mobile readability | Required validation | Check 390px and tablet layouts, long titles, all tile sizes, dialog overflow, focus return and Escape. Contact actions enlarged to 44px. |
| Spotify / YouTube / Instagram | Selective | Spotify / YouTube exist. Prefer a curated photo gallery and outbound Instagram link over a live feed dependency. |
| Custom domain / clean URL | Keep | Already self-hosted; not a feature gap. |
| Remove Powered by | Low priority | Tiles footer is self-branding; removal is a presentation preference, not evidence of work. |
| Analytics | Improve later | Separate project opens, project outbound clicks, email and booking events; report clear denominators. Do not label raw clicks as conversions. |
| Lead capture | Fix reliability now, defer expansion | Await server acknowledgement; retain input and show an error on failure; preview never pretends to submit. Newsletter stays optional. |
| Booking / digital card | Configure before expanding | Booking block exists. Seed contains a generic cal.com URL; verify actual saved production settings rather than publishing a placeholder. |
| Testimonials | Add only real evidence | Existing block; quote only approved client feedback. |
| AI editor / Canva integration | Defer | Serves a page-builder business, with limited benefit for this personal portfolio. |
| Video avatars / animated backgrounds | Defer | Can distract from project proof and increase loading/motion costs. |
| E-commerce / shops / donations / courses | Defer | No defined offer or checkout need. An external payment link is sufficient if an offer emerges. |
| Playable piano | Optional later | Personal signature, subordinate to work; AI Studio uses pointer-only div keys. Rebuild with native buttons and keyboard activation if selected. |
| F1 live widget | Do not port in this slice | Requires the Node /api/f1 route absent from PHP Tiles; adds periodic requests and live-state correctness work. Prefer a curated F1 project card. |
| LinkStack / LittleLink / OpenBento / Type.link | Patterns only | Do not migrate the working PHP + vanilla app just to match a competitor feature list. Current offers were not fully verified. |

## AI Studio boundaries

Keep the PHP runtime, existing editor, saves, server data and uploads.
No Node/Express migration, dependency installation, F1 polling, Notes code or Notes features are imported.
Existing portfolio content, including any pre-existing project references, is unchanged.
Do not copy the reference CSS wholesale: several added selectors do not match the current renderer.

## Content priorities

1. Select three strongest projects with real screenshots, personal responsibility, problem and demonstrable result.
2. Keep a single clear contact path and configure the real booking URL if booking is wanted.
3. Place experiments and personal interests after selected work; keep them as personality and evidence of craft.
4. Only then add optional media, testimonials or richer analytics.

The new case-study fields are empty by default. Existing project links keep their behavior until proof is entered.
Use the editor to fill these fields with confirmed facts; the application does not invent customer outcomes.

## Validation

Full app.js syntax compilation passed in V8.
Ten focused rendering checks passed: legacy behavior, optional/empty proof, accessible trigger,
unsafe URL rejection, title escaping, semantic photo/project images, lazy loading, absence of F1 imports.
A reproducible Node test file is included; its Node command was not executed here.
No PHP files changed. No deployment, merge or production content write performed.

Before merge: run node --test tests/portfolio.test.cjs, then test public and admin PHP pages.
Check case-study open/close/Escape/focus return, project outbound link, all tile sizes at 390px and desktop,
editing/saving/reloading proof fields, signup success/failure/retry, preview signup, image loading and alt text.

## Reference freshness

Direct retrieval of https://bento.me/ on the review date resolved to https://linktr.ee/.
Treat the supplied Bento comparison as historical inspiration, not a current plan/pricing comparison.
Other listed vendors' free tiers, analytics and current availability are not established by this review.
