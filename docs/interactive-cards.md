# Interactive music, sport and map cards

This extends the existing PHP + vanilla JS app. No Notes code, paid SDK, account,
API secret or Node production runtime is introduced. The previous portfolio PR is
already merged; this change starts from main at 82dbb88de5d48893954e60298b24734c8ff24909.

## Use

Open the authenticated editor, choose **Add block**, then:

- **Radio interactive**: choose gospel, classical or jazz.
- **F1 interactive**: choose Courses or Pilotes in preview/public mode.
- **Carte interactive**: set a place label, latitude, longitude and zoom.

All five sizes are supported. `S` and strip show one record, `W` three,
`T` five and `L` eight. Larger sports cards include circuit/time or team/wins;
small cards suppress the introduction and secondary heading. Every size retains
native keyboard-focusable buttons at least 44px tall. Card height may expand
after activation so controls, attribution and content are not clipped.

The map starts only after a click; pan, zoom buttons, marker popup, recenter,
close and an external directions link are available. Mousewheel zoom is disabled
to preserve page scrolling. Opening the map downloads the version-pinned
MapLibre 6.16.0 ES module and CSS from UNPKG, then OpenFreeMap tiles. There is no
bundler or npm install for production. MapLibre is an optional browser dependency,
not a new server runtime. Keep existing OpenStreetMap/OpenMapTiles attribution visible.

For a standalone gallery, serve **examples/widgets.html** through the PHP host.
It exercises all 15 type/size combinations without replacing portfolio content.
It needs scripts and markup from assets/ and the root widgets.php endpoint.
No new cards are silently inserted into existing saved page data.

## Providers and cost controls

The public-apis directory is a discovery index, not authoritative pricing or a
working demo. Its Ergast entry is outdated; Jolpica is the replacement used here.

| Provider | Published access checked 2026-11-06 | Application rule |
| --- | --- | --- |
| Jolpica F1 | Unauthenticated, 4 requests/s and 500/hour; limits may decrease | At most 24 attempts/day across both resources, at least 2s apart; 1h cache per resource |
| Radio Browser | Free, no numeric guaranteed allowance or uptime published | At most 6 attempts/day across all genres, at least 2s apart; 24h cache per genre |
| OpenFreeMap | Public instance free, no map-view/request limits, no key | Only activate on click; no background prefetch or offline region downloads |
| Radio streams | Direct third-party broadcaster streams | No autoplay or preload; one stream at a time, released on stop, pagehide, hidden tab or grid rerender |

Budgets apply to upstream attempts from this deployment, not to each visitor.
The five allowed resource keys cannot be expanded through arbitrary user queries.
The gateway locks the shared state while checking freshness, reserving quota,
fetching and caching. Successful responses are normalized before reaching the client.
Failed fetches consume budget. There is no retry loop, alternate paid provider or
paid-plan upgrade. A 429 suspends the entire provider for at least 24h and honors
a longer Retry-After value. Other errors suspend the provider for 15 minutes.
The browser coalesces identical requests, caches success for 5 minutes and backs
off after failure. No setInterval or polling is used.

On quota exhaustion/failure, use a cached result up to 7 days old, explicitly
labelled **Cache ancien**, with its original timestamp. Beyond that, stop and
show an unavailable message. Results are never labelled live; F1 standings and
calendar are snapshots, not real-time timing. Race dates use the visitor's local
timezone, and past scheduled starts are filtered out of the upcoming list.

There is no promise that an external service's terms will never change. Other
apps using the same upstream IP also affect its limits. These controls bound
**this app's** traffic and avoid paid credentials/billing; they cannot guarantee
third-party availability. Preserve data/widget-cache between deploys and share it
across all app processes/replicas, or each separate installation gets its own budget.
Deleting usage.json resets the counter; do not do this as a refresh mechanism.
Corrupt/unwritable quota state fails closed before an outbound request.

Set server environment **TILES_WIDGETS_OFF=1** to disable all upstream API fetches
(existing fresh/stale cache may still display). Maps and streams are separately
activated browser resources, not requests through this API gateway.

Radio Browser station discovery uses one official mirror with an identifying
User-Agent and filters for HTTPS MP3 streams. Streams may still fail, be blocked
by a broadcaster, require consent or be geographically restricted; the UI shows
an error and allows another choice. No playlist files, HLS decoder, broadcaster
proxy, station voting or popularity click reporting are added in this slice.

## Files and requirements

- widgets.php: public read endpoint; accepts fixed resource keys only.
- widget-cache.php: normalization, persistent budgets, cache and cURL fetches.
- assets/widgets.js and widgets.css: editable definitions, responsive rendering,
  on-demand fetch/player/map controls, cleanup and failure states.
- lib.php: loads the optional module before the main application.
- assets/app.js: registers block types and disposes media/maps before grid changes.

Requires PHP 8.1+ with cURL and writable **data/** (already used by Tiles).
The existing data/.htaccess must remain installed so cached state cannot be read
as public files. Root .htaccess also blocks direct requests to widget-cache.php.
No secret is stored in browser code. Server fetch URLs are hardcoded; external
redirects and non-HTTPS protocols are refused; timeouts and a 1 MiB body limit apply.

## Validation

Run:

```sh
node --check assets/app.js
node --check assets/widgets.js
node --test tests/*.test.cjs
php -l widget-cache.php
php -l widgets.php
php -l lib.php
php tests/widget-cache.test.php
```

The Node suite includes the previous portfolio regression checks and checks all
15 type/size combinations, escaped titles, size detail counts, coordinate and
protocol validation, and absence of autoplay/embedded remote loads in initial markup.
Interaction tests verify that concurrent cards share one request, failures back
off, list length follows size, only one audio stream plays, and hiding the page
releases the stream.
The PHP suite uses a mocked fetcher and temporary files: no paid/external calls.
It covers limits, daily reset, shared caches, failed attempt accounting, Retry-After,
cross-resource cooldown, the kill switch, corrupt counters and stream filtering.

Also test through a PHP host: select all genres, try play/stop/error, switch F1
views, inspect a real data timestamp, resize/reorder/delete cards, and verify
maps release resources after close/rerender/tab-hide. Test at 390px and desktop,
with keyboard, offline, unavailable WebGL, 429, empty lists and exhausted budgets.

Current execution: Node syntax checks and 11 tests passed. PHP is not installed
in the workspace. Installing it failed because this managed environment cannot
switch package-manager user identities. The cloud browser could not reach the
workspace's localhost preview. PHP execution and visual/end-to-end validation
remain pending; fixtures are not evidence of live upstream responses.

## Official references

- Discovery: https://github.com/public-apis/public-apis
- Jolpica replacement and endpoints: https://github.com/jolpica/jolpica-f1/blob/main/docs/README.md
- Jolpica limits: https://github.com/jolpica/jolpica-f1/blob/main/docs/rate_limits.md
- Radio Browser: https://docs.radio-browser.info/
- OpenFreeMap policy: https://openfreemap.org/
- OpenFreeMap setup: https://openfreemap.org/quick_start/
- MapLibre browser/ES module setup: https://maplibre.org/maplibre-gl-js/docs/
