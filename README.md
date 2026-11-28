# Tiles

Bento-style link-in-bio and portfolio in vanilla JavaScript + PHP. No Composer packages, database or Node runtime is needed in production. PHP 8.5+ with sessions, cURL, GD and fileinfo is supported; Node 24 runs development checks.

## Project structure

```text
tiles/
├── public/                 # Apache/Nginx document root
│   ├── index.php           # Public portfolio
│   ├── admin.php           # Password-protected editor
│   ├── api.php             # Saves, uploads, stats and subscriptions
│   ├── widgets.php         # HTTP gateway for cached external data
│   ├── media.php           # Serves allowlisted files from private uploads/
│   ├── assets/{css,js,images,vendor}/
│   ├── robots.txt
│   └── .htaccess
├── src/                    # Private PHP helpers and templates
├── config/                 # config.example.php; ignored config.php
├── seed/{data,uploads}/    # Initial JSON, one-time patches and media
├── data/                   # Private runtime JSON, locks, backups and cache
├── uploads/                # Private runtime images/PDFs
├── scripts/                # Local router, initial admin setup and checks
├── tests/{js,php}/
├── docs/{setup,features,development}/
└── examples/               # Development fixtures, not publicly served
```

## Run locally

```sh
php -S 127.0.0.1:8080 -t public scripts/dev-router.php
```

On a **new installation**, create the administrator once with `php scripts/setup-admin.php`: it reads a new password from stdin (10+ characters), never from command-line arguments, and refuses to overwrite an existing administrator. Use a protected pipe or terminal input; the CLI does not mask terminal echo. No usable default password/hash is shipped. Existing `data/auth.json` is preserved during upgrades.

Optional API configuration: copy `config/config.example.php` to ignored `config/config.php`, or use `FOOTBALL_DATA_TOKEN` / `TILES_CONFIG_FILE`. An existing root `config.local.php` remains a read-only compatibility fallback until it is moved. Secrets are never sent in the browser boot payload.

## Deploy or upgrade

Set the server document root to **`public/`**. Keep `data/`, `uploads/`, `config/`, `src/` and `seed/` outside it; give the PHP user write access only to `data/` and `uploads/`. Do not copy private folders into `public/`.

Existing `index.php`, `admin.php`, `api.php`, `widgets.php` and `uploads/<name>` URLs keep working. The root `.htaccess` is an Apache migration fallback for hosts which still serve the repository root; it forwards an explicit public allowlist and rejects everything else. It requires `mod_rewrite`. Prefer a real `public/` document root.

Read [hosting and migration](docs/setup/hosting.md) for Apache/Nginx examples, Hostinger steps, runtime retention and rollback. Git deployments never replace existing runtime JSON, uploads or passwords. Seed patches keep their original filenames and applied-patch state.

## Portfolio and editor

The original card sizes, case studies, piano, sports illustrations, QR sharing, vCard, languages, logos, maps and cached widgets are retained. Universes filter the page without moving its tiles. The four defaults (Profil, Parcours, Créations, Passions) can be renamed, recoloured, reordered, deleted or extended up to 12 in Design › Univers; each one gets its own URL (`/<slug>`), sitemap entry and crawler-readable HTML, and an unknown slug answers 404. The editor can assign a tile's universe and create a Markdown journal with autosaved drafts, explicit publication, reading time and delete/undo. Visitor responses exclude draft article content. JSON exports include the journal; imports preserve the current server revision to retain conflict protection.

## Bento blocks, motion and editor

FAQ, progress bars, process steps and local time blocks; big numbers count up when they appear. Filters and sections animate with View Transitions, precise pointers get a soft spotlight, and every motion respects `prefers-reduced-motion`. The editor has undo/redo (Ctrl/Cmd+Z, Ctrl+Shift+Z), Alt + arrow keys and long-press touch reordering, and a block search. Stats add cookieless daily unique visitors, traffic sources (in-app browsers, `utm_source`, referrer host) and devices. See [the Bento benchmark](docs/development/bento-benchmark.md).

## Leap links

Every tile with a URL has a tracked link `/go/<tile-id>` (shown in the tile editor). It counts the visit in `data/stats.json` (`clicks` and `go`), then redirects with a 302 to the tile's stored URL. The destination is never read from the request, hidden or out-of-schedule tiles return 404, only `http(s)` URLs are used, and HEAD requests, prefetches and link-preview bots are not counted. `/go/` is disallowed in `robots.txt`.

## SEO

`/robots.txt`, `/sitemap.xml` and `/llms.txt` are generated from the page content (`public/seo.php`). Set `site_url` in `config/config.php` (or `TILES_SITE_URL`), for example `https://brandonlazarre.fr`, so canonical links, Open Graph URLs, the sitemap and the JSON-LD (Person + WebSite) always use one public origin whatever domain serves the install. Without it, only a syntactically valid Host header is used. The home page also ships robots/author/locale meta tags and crawler-readable HTML for every visible tile; `admin.php` is `noindex`. After deployment, submit `/sitemap.xml` in Google Search Console and Bing Webmaster Tools and verify the rich results of the home page.

## Checks

```sh
npm run check
npm test
```

There are no npm dependencies to install. `test:js`, `test:php` and `test:http` run the suites separately. The HTTP suite starts an isolated PHP server with temporary data/uploads, exercises authentication, saves, media and private-path denials, and removes its fixtures. `PHP_BINARY` selects a non-default PHP executable. Node-only test runs skip the HTTP suite when PHP is unavailable; CI runs it on PHP 8.5, the minimum version (`src/paths.php` refuses to start below it).

See [API setup](docs/setup/api-setup.md), [interactive cards](docs/features/interactive-cards.md), and [integration decisions](docs/development/github-sync.md). Third-party asset licenses remain beside their vendored assets.
