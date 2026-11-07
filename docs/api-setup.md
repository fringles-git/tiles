# API setup: F1, PSG and France

Implemented 2026-11-07 against main 1ef4ff232caa8f4396ba79c2168f78bef8edbb8a.

| Card | Provider | Setup |
| --- | --- | --- |
| F1 | Jolpica | No key; PHP cURL and writable data/ |
| PSG and France men's team | football-data.org v4 | One free account and server-only token |
| Radio | Radio Browser | No key |
| Maps | OpenFreeMap | No key; WebGL for embedded maps |

## Activate football

1. Register for the **Free (€0)** plan at https://www.football-data.org/client/register.
   Obtain the token from your account. No paid plan or live-score add-on is required.
2. Set **FOOTBALL_DATA_TOKEN** in the PHP server environment. Node environment
   settings may not apply to PHP; follow the host's PHP settings.
3. If that is unavailable, copy **config.example.php** to **config.local.php**
   on the host and fill in `football_token` privately. It is ignored by Git and
   blocked by Apache. Prefer a file outside the web root with **TILES_CONFIG_FILE**
   pointing to its absolute path when supported. Non-Apache hosts must explicitly
   deny public access to config files, PHP helpers, data/, seed/ and .env.
4. In the authenticated Tiles editor, open **APIs**. It checks token presence,
   cURL, storage, team presets and budget use without displaying the token or
   calling upstream APIs. Presence is not proof of token validity.
5. Open PSG/France in preview and check actual team names and timestamps.
   If unavailable, check token permissions and provider coverage. Do not delete
   quota files to force a refresh.

Never put a token in a tile, exported JSON, screenshot, public JavaScript or GitHub.
No external account or credential was created, and no production token was validated.

## Presets and other supporters

Presets are **F1**, **PSG** (football-data ID 524) and **France senior men's team**
(ID 773). Every Sport block has a **Supporter de** selector. Verify returned team
identities after connecting; live authenticated endpoints were unavailable here.

Patch 004 upgrades the original seeded F1 interest and combined football card,
adds a France card and upgrades the language card. The existing patch runner
backs up page.json first. Custom-ID cards remain untouched; use the editor to
configure those. Current declared bilingual C2 levels are kept distinct from the
historical DCL B2+ certificate; no C2 certificate is claimed.

To allow another club, add it to the private config and reload the editor:

```php
return [
    'football_token' => '', // Or use FOOTBALL_DATA_TOKEN.
    'teams' => [
        'my-club' => [
            'id' => 1234, // Example only: replace with the actual football-data ID.
            'name' => 'My club',
            'url' => 'https://club.example/',
        ],
    ],
];
```

This is a reusable page-builder setting, not a multi-account supporter platform.
Other sports need their own reviewed provider adapter and request budget.

## Free-plan boundaries

The official free tier currently includes delayed scores/schedules, fixtures and
tables for 12 competitions, at **10 calls/minute**. Ligue 1, Champions League,
World Cup and Euros are included. France qualifiers, Nations League, friendlies
and domestic cups are not assumed covered. Cards label delayed/partial coverage
and retain official-site links. Missing scores display “—”, never an invented 0–0.

Football requests share a **6-hour cache**, **24 attempts/day across all teams**,
and **at least 7 seconds between attempts** (fewer than 10/minute). Tabs reuse
one snapshot. Errors count against budget; 429 cooldown honors Retry-After.
F1 and radio retain separate 24/day and 6/day budgets. Preserve shared
data/widget-cache across deploys and replicas. Other apps sharing the token also
consume its quota. The app never upgrades plans or adds paid fallbacks; external
terms and coverage can change.

## Portfolio interactions

- Accent-insensitive search and project/photo/career/personal categories.
- Skill chips find related projects; all projects have an overview and optional website link.
- Photo/gallery viewer with previous/next, arrow keys, Escape and native dialog focus.
- Playable piano buttons and click-to-load Spotify, alongside radio and map controls.
- Language badges and expandable proficiency details (not automatic site translation).
- Employer links: local official Action SVG; Basic-Fit's verified official logo URL
  with a text label; readable initials for companies without a supplied logo.
- Local Simple Icons for supported technologies/GitHub/Spotify; CC0 license bundled.
- Company blocks with an optional uploaded logo; profile sharing; email/phone links and copying.

Search does not alter saved data. Media/maps are released on grid rerender and page hide.
PHP + vanilla JS remain; no Notes app features are added.

## Verification

19 Node tests pass, including football routing/tab reuse/null scores, search,
language details, media activation, size variants and logo safety. PHP tests are
provided for football rate limits, coverage filtering and token exclusion.
Run on a PHP 8.1+ host with cURL:

```sh
php -l widget-config.php
php -l widget-cache.php
php -l api.php
php -l lib.php
php tests/widget-cache.test.php
php tests/football.test.php
node --test tests/*.test.cjs
```

PHP execution, authenticated provider responses, and visual/mobile end-to-end
checks remain unverified here. No merge or deployment performed.

## Sources

- https://www.football-data.org/pricing
- https://www.football-data.org/coverage
- https://docs.football-data.org/general/v4/team.html
- https://docs.football-data.org/general/v4/policies.html
- https://www.action.com/fr-fr/
- https://www.basic-fit.com/fr-fr/
- https://github.com/simple-icons/simple-icons
