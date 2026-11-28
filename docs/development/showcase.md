# Showcase page and capability inventory — 28 November 2026

`examples/showcase/page.json` is one demo page that uses every capability of the editor, so the live version can be checked against it. The content is realistic but fictional (persona « Camille Arnaud »): e-mails and links on reserved `example.com` domains, phone in the fiction range `+33 1 99 00`, no `TBD` placeholder. A block left empty is hidden on the public page, so placeholders are never needed.

`tests/js/showcase.test.cjs` keeps it honest. It fails when a block type, social network or size is missing; when the file is no longer a valid page in PHP or JS; when the Add-block catalogue drifts; or when the file contains a `TBD` placeholder, real personal data, or a contact or link outside the reserved demo domains.

## Use it

> **Warning.** Importing replaces the whole page, journal included. Do it on a local or test install (`php -S 127.0.0.1:8080 -t public scripts/dev-router.php`), or export the live page first (Export › Download), then import it back afterwards.

1. Editor › Export › paste `examples/showcase/page.json` › Import. The `_capabilities` note is dropped on import.
2. Walk through each universe tab and compare it with the live page using the checklist below.
3. Restore your own export.

## Inventory

### Universes
| Item | Supported | In showcase |
|---|---|---|
| Default universes | Profil, Parcours, Créations, Passions (keys `humain`, `pro`, `crea`, `lifestyle`) | 4, each with its question |
| Custom universes | Up to 12 in total: name ≤ 40, address `[a-z0-9-]` ≤ 40 and not reserved, colour, question ≤ 200 | `Univers personnalisé` at `/univers-personnalise` |
| Per universe | Own URL, sitemap entry, crawler HTML, nav tab with count, journal filter | yes |
| Unknown or deleted address | 404 + `noindex` | to test: `/nope` |

### Block types (38) — Add-block order

| Category | Type | Label | Default size | Fields | Choice lists | Tiles |
|---|---|---|---|---|---|---|
| Essentials | `link` | Link | w | title, url, desc, color | — | 4 |
| Essentials | `social` | Social profile | s | platform, handle, url, cta | platform: 17 options | 17 |
| Essentials | `contact` | Contact | w | title, email, phone | — | 1 |
| Essentials | `text` | Text note | w | text, style | style: note, quote | 7 |
| Essentials | `image` | Photo | s | image, caption, url | — | 1 |
| Essentials | `section` | Section title | full | title | — | 8 |
| Essentials | `map` | Location | s | place, note, url | — | 1 |
| Essentials | `atlas` | Carte interactive | l | place, lat, lon, zoom, note | — | 1 |
| Work | `project` | Project | l | title, role, year, desc, tags, image, url, problem, solution, outcome | — | 4 |
| Work | `company` | Entreprise | w | brand, title, desc, image | brand: action, basicfit, hugoboss, edf, github, spotify | 1 |
| Work | `experience` | Experience | t | title, items, logoFor, logo | — | 1 |
| Work | `education` | Education | t | title, items, logoFor, logo | — | 1 |
| Work | `skills` | Skills | w | title, items | — | 1 |
| Work | `languages` | Langues | w | title, items | — | 1 |
| Work | `cv` | Résumé | s | title, updated, file, url | — | 1 |
| Work | `stat` | Big number | s | value, label, color, logos | logos: (vide), employers | 2 |
| Work | `progress` | Progress | w | title, items, color | — | 1 |
| Work | `testimonial` | Testimonial | w | quote, author, role | — | 1 |
| Work | `steps` | Process | w | title, items | — | 1 |
| Work | `faq` | FAQ | w | title, items | — | 1 |
| Work | `booking` | Booking | w | title, duration, url | — | 1 |
| Creative | `gallery` | Gallery | l | title, images, url | — | 1 |
| Creative | `video` | Video | w | title, platform, url, image | — | 1 |
| Creative | `music` | Music | s | title, artist, service, url, image | service: spotify, apple, deezer, soundcloud, youtube | 5 |
| Creative | `radio` | Radio interactive | w | title, genre, note | genre: gospel, classical, jazz | 3 |
| Creative | `instrument` | Instrument | w | name, kind, since, also, note | kind: piano, bass, sax, voice, other | 5 |
| Creative | `event` | Event | w | title, date, place, url | — | 1 |
| Personal | `now` | Now | w | text, updated | — | 1 |
| Personal | `clock` | Local time | s | place, tz | tz: 19 options | 1 |
| Personal | `interest` | Interest | s | title, desc, color, url | — | 1 |
| Personal | `media` | Book / show / game | s | kind, title, by, url, image | kind: Reading, Watching, Playing, Listening | 4 |
| Personal | `team` | Football club | s | club, league, c1, c2, url | — | 1 |
| Personal | `sport` | Sport interactif | w | follow, view, f1follow, title, note | follow: TBD (catalogue serveur) ; view: calendar, standings, teams, follow, results | 5 |
| Personal | `countdown` | Countdown | s | title, date | — | 1 |
| Personal | `faith` | Faith | w | verse, ref, church, url | — | 1 |
| Earn | `product` | Product | s | name, price, desc, image, url | — | 1 |
| Earn | `tip` | Tip jar | w | title, desc, amounts, currency, url | — | 1 |
| Earn | `form` | Email signup | w | title, desc, button | — | 1 |


Choice lists with one tile per option in the showcase: social `platform` (17), text `style` (2), stat `logos` (2), music `service` (5), radio `genre` (3), instrument `kind` (5), media `kind` (4), sport `view` (5). Project kinds (SaaS, App, Site, Expérience) are inferred from tags, so there are 4 projects. Not expanded (one tile, default value): company `brand` (6 brands from the logo library), clock `tz` (19 zones), sport `follow` (comes from the server's team settings: **TBD**).

### Social networks (17)
Instagram, TikTok, YouTube, X, LinkedIn, GitHub, Behance, Dribbble, Twitch, WhatsApp, Threads, Facebook, Vimeo, SoundCloud, Pinterest, Discord, Snapchat.

### Sizes and tile options
| Item | Values | In showcase |
|---|---|---|
| Sizes | `s` Small, `w` Wide, `t` Tall, `l` Large, `bar` Strip; `full` for headings | `Sizes` section (custom universe) |
| Spotlight | `spot: true` | `sc-opt-spot`, first project |
| Hidden | `hidden: true` | `sc-opt-hidden`, absent from the public page |
| Schedule | `start` / `end` (YYYY-MM-DD) | `sc-opt-scheduled`, 1–31 Dec 2026: absent until then |
| Universe | `universe: <key>` | every tile |

### Profile, theme, journal (one value at a time: change them by hand)
| Area | Options | Showcase value |
|---|---|---|
| Header | classic, centered, cover (needs a banner), minimal | classic |
| Profile fields | name, role, tags, bio, location, status + on/off, avatar, banner + still image, e-mail, phone, booking, CV (PDF) + note, opening hours (days, from, to, note), show nav | `TBD`; images empty; hours Mon–Fri 09:00–18:00 |
| Skin | auto, porcelain, graphite, sage, midnight, paper | auto |
| Accent | 8 swatches + any colour | `#0B7A75` |
| Typeface | grotesk, editorial, mono | grotesk |
| Profile position | side, top | side |
| Radius / spacing | 6–36 px / 6–24 px | 24 / 14 |
| Journal | Markdown, universe, date, excerpt, published or draft | 1 published, 1 draft |

### Not representable in page.json (check in the editor)
Undo/redo, Alt + arrow keys and long-press reordering, block search, live preview, duplicate, QR, vCard, sharing, visitor theme toggle, statistics (views, unique visitors, sources, devices, rate per block), leap links (`/go/<id>`), API settings for widgets.

## Order findings

Answering point 4 of the request. Measured in Chrome on the seed page (52 tiles):

- **Cause:** `.grid { grid-auto-flow: dense }` lets a later small tile fill an earlier gap, even when that puts it above its own section heading.
- **Desktop (1280 px):** 12 tiles show above their heading, for example « Ma foi » above « Église », « Travaillons ensemble » above « Contact », « Porsche 911 » above « Car spotting », and « Formule 1 » and « PSG » above « En dehors du travail ».
- **Phone (390 px):** 4 tiles show above their heading.
- **Fix:** proposed separately in its own PR (packing limited to each section).
- **Universe nav order:** now set by you in Design › Univers (↑ ↓).
- **Add-block catalogue:** now an explicit `CATALOGUE` list in `app.js`, the same order as this file and the table above. Before, it was the order in which the scripts loaded, so newer blocks (languages, company, FAQ, progress, steps, local time) came last.
- **Live tile order:** **TBD.** Which tiles on tiles.brandonlazarre.fr are in the wrong place? If they are the ones listed above, the packing fix covers them.

## TBD

- Real content for every field, and the question of each universe.
- The order of live tiles you expect (see above).
- Sports teams beyond F1 (server settings), radio stream availability, company logos for the brands you will show.
- Header, skin, typeface and layout variants are not in the file: test each one by hand.

## Implementation plan

| # | Step | State |
|---|---|---|
| 1 | Custom universes: data model, PHP/JS parity, routes, sitemap, 404, editor in Design › Univers, undo | Merged (#43), live |
| 2 | Showcase `page.json`, catalogue order, coverage and sanitization test, this inventory | This PR |
| 3 | Section-bounded packing: tiles never show above their heading | Separate PR, to arbitrate (visual change: possible gaps at the end of a section) |
| 4 | Fill the showcase with realistic content and universe questions | Waiting for your data |
| 5 | Reorder live tiles if anything remains after step 3 | Waiting for your list |
