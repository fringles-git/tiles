<?php
declare(strict_types=1);
require_once __DIR__ . '/paths.php';
require_once __DIR__ . '/widget-config.php';
require_once __DIR__ . '/throttle.php';

ini_set('display_errors', '0');

// Uploads: GD needs ~4 bytes per pixel, so the cap protects memory_limit (40 MP ≈ 160 MB).
const UPLOAD_MAX_SIDE = 10000;
const UPLOAD_MAX_PIXELS = 40_000_000;
error_reporting(E_ALL);

/**
 * First run: copy the starting content out of seed/data/ into data/ and uploads/.
 * Runtime files are never tracked in Git, so redeploying the code never
 * overwrites edits, uploaded photos, stats or the password.
 */
(function (): void {
    foreach ([DATA_DIR, UPLOAD_DIR] as $dir) {
        if (!is_dir($dir)) {
            @mkdir($dir, 0755, true);
        }
    }
    foreach (['page.json', 'auth.json'] as $f) {
        if (!is_file(DATA_DIR . '/' . $f) && is_file(SEED_DATA_DIR . '/' . $f)) {
            @copy(SEED_DATA_DIR . '/' . $f, DATA_DIR . '/' . $f);
        }
    }
    if (!is_file(DATA_DIR . '/.seeded')) {
        foreach (glob(SEED_UPLOAD_DIR . '/*') ?: [] as $img) {
            $dest = UPLOAD_DIR . '/' . basename($img);
            if (!is_file($dest)) {
                @copy($img, $dest);
            }
        }
        @file_put_contents(DATA_DIR . '/.seeded', gmdate('c'));
    }

    // One-time content updates shipped with the code (seed/data/patches/*.json), applied once each.
    $patches = glob(SEED_DATA_DIR . '/patches/*.json') ?: [];
    if ($patches && is_file(DATA_DIR . '/page.json')) {
        sort($patches);
        $doneFile = DATA_DIR . '/patches-applied.json';
        $done = is_file($doneFile) ? (json_decode((string) file_get_contents($doneFile), true) ?: []) : [];
        $todo = array_values(array_filter($patches, fn($f) => !in_array(basename($f), $done, true)));
        if ($todo) {
            $lock = fopen(DATA_DIR . '/page.lock', 'c');
            flock($lock, LOCK_EX);
            $page = json_decode((string) file_get_contents(DATA_DIR . '/page.json'), true);
            if (is_array($page)) {
                if (!is_dir(DATA_DIR . '/backups')) {
                    @mkdir(DATA_DIR . '/backups', 0755, true);
                }
                @copy(DATA_DIR . '/page.json', DATA_DIR . '/backups/page-before-patch-' . gmdate('Ymd-His') . '.json');
                foreach ($todo as $f) {
                    $patch = json_decode((string) file_get_contents($f), true);
                    if (is_array($patch)) {
                        if (isset($patch['profile']) && is_array($patch['profile'])) {
                            $page['profile'] = array_replace_recursive($page['profile'] ?? [], $patch['profile']);
                        }
                        $remove = array_map('strval', (array) ($patch['removeTiles'] ?? []));
                        if ($remove) {
                            $page['tiles'] = array_values(array_filter($page['tiles'], fn($tl) => !in_array((string) ($tl['id'] ?? ''), $remove, true)));
                        }
                        $existing = array_column($page['tiles'], 'id');
                        foreach (($patch['addTiles'] ?? []) as $add) {
                            $tile = $add['tile'] ?? null;
                            if (!is_array($tile) || empty($tile['id']) || in_array($tile['id'], $existing, true)) {
                                continue;
                            }
                            $pos = array_search($add['after'] ?? '', array_column($page['tiles'], 'id'), true);
                            array_splice($page['tiles'], $pos === false ? count($page['tiles']) : $pos + 1, 0, [$tile]);
                            $existing[] = $tile['id'];
                        }
                        foreach (($patch['tiles'] ?? []) as $id => $changes) {
                            foreach ($page['tiles'] as $i => $tile) {
                                if (($tile['id'] ?? '') === $id && is_array($changes)) {
                                    $page['tiles'][$i] = array_replace_recursive($tile, $changes);
                                }
                            }
                        }
                    }
                    $done[] = basename($f);
                }
                $page['rev'] = (int) ($page['rev'] ?? 0) + 1;
                foreach (glob(SEED_UPLOAD_DIR . '/*') ?: [] as $file) {
                    if (!is_file(UPLOAD_DIR . '/' . basename($file))) {
                        @copy($file, UPLOAD_DIR . '/' . basename($file));
                    }
                }
                $tmp = DATA_DIR . '/page.json.tmp' . bin2hex(random_bytes(4));
                if (file_put_contents($tmp, json_encode($page, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT)) !== false) {
                    rename($tmp, DATA_DIR . '/page.json');
                    file_put_contents($doneFile, json_encode($done));
                }
            }
            flock($lock, LOCK_UN);
            fclose($lock);
        }
    }
})();

function read_json(string $file, $default)
{
    $path = DATA_DIR . '/' . $file;
    if (!is_file($path)) {
        return $default;
    }
    $data = json_decode((string) file_get_contents($path), true);
    return is_array($data) ? $data : $default;
}

function write_json(string $file, array $data): bool
{
    $path = DATA_DIR . '/' . $file;
    $tmp = $path . '.tmp' . bin2hex(random_bytes(4));
    $json = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
    if ($json === false || file_put_contents($tmp, $json, LOCK_EX) === false) {
        @unlink($tmp);
        return false;
    }
    if (!rename($tmp, $path)) {
        @unlink($tmp);
        return false;
    }
    return true;
}

/** Run $fn while holding an exclusive lock, so concurrent requests never lose updates. */
function with_lock(string $name, callable $fn)
{
    $handle = fopen(DATA_DIR . '/' . $name . '.lock', 'c');
    flock($handle, LOCK_EX);
    try {
        return $fn();
    } finally {
        flock($handle, LOCK_UN);
        fclose($handle);
    }
}

/**
 * X-Forwarded-Proto is honoured only from a configured proxy (TILES_TRUSTED_PROXIES or
 * 'trusted_proxies' in config.php): any client can send that header.
 */
function is_https(?array $server = null, ?array $proxies = null): bool
{
    $server ??= $_SERVER;
    if (!empty($server['HTTPS']) && $server['HTTPS'] !== 'off') {
        return true;
    }
    $proxies ??= tiles_trusted_proxies();
    return ($server['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https'
        && in_array((string) ($server['REMOTE_ADDR'] ?? ''), $proxies, true);
}

/** Exact proxy IP addresses, from the environment (comma-separated) or config.php. */
function tiles_trusted_proxies(): array
{
    $env = getenv('TILES_TRUSTED_PROXIES');
    $list = $env !== false ? explode(',', $env) : (array) (tiles_private_config()['trusted_proxies'] ?? []);
    return array_values(array_filter(array_map(fn ($ip) => trim((string) $ip), $list),
        fn ($ip) => filter_var($ip, FILTER_VALIDATE_IP) !== false));
}

function start_session(): void
{
    session_name('TILESSID');
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'secure' => is_https(),
        'httponly' => true,
        'samesite' => 'Strict',
    ]);
    ini_set('session.use_strict_mode', '1');
    session_start();
    if (empty($_SESSION['csrf'])) {
        $_SESSION['csrf'] = bin2hex(random_bytes(16));
    }
}

function is_admin(): bool
{
    return !empty($_SESSION['admin']);
}

/** Convert stored stats into the shape the editor's Stats view expects. */
function stats_for_editor(): array
{
    require_once __DIR__ . '/stats.php';
    $st = read_json('stats.json', []);
    $window = stats_window($st, time(), 30) + stats_audience_window($st, time(), 30);
    $leads = array_map(fn($l) => (string) ($l['email'] ?? ''), read_json('leads.json', []));
    return [
        'sample' => false,
        'views' => (int) ($st['views'] ?? 0),
        'days' => $window['days'],
        'clickDays' => $window['clickDays'],
        'goDays' => $window['goDays'],
        'uniqDays' => $window['uniqDays'],
        'srcDays' => $window['srcDays'],
        'devDays' => $window['devDays'],
        'clicks' => (object) ($st['clicks'] ?? []),
        'go' => (object) ($st['go'] ?? []),
        'leads' => array_values($leads),
    ];
}

/** One random nonce per response, for the inline TILES_BOOT script. */
function csp_nonce(): string
{
    static $nonce = null;
    return $nonce ??= rtrim(strtr(base64_encode(random_bytes(18)), '+/', '-_'), '=');
}

/**
 * Content Security Policy for HTML pages. Third parties are listed one by one:
 * YouTube (nocookie) and Spotify players, the map (MapLibre from unpkg, OpenFreeMap tiles),
 * radio streams (any HTTPS host). Inline style attributes stay allowed: tile markup uses them.
 */
function csp_policy(string $nonce): string
{
    return implode('; ', [
        "default-src 'self'",
        "script-src 'self' 'nonce-$nonce' https://unpkg.com",
        "style-src 'self' 'unsafe-inline' https://unpkg.com",
        "img-src 'self' data: blob: https:",
        "font-src 'self'",
        "connect-src 'self' https://tiles.openfreemap.org",
        "media-src 'self' blob: https:",
        'frame-src https://www.youtube-nocookie.com https://open.spotify.com',
        "worker-src 'self' blob:",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'self'",
    ]);
}

/**
 * CSP starts in report-only mode (violations only appear in the browser console):
 * set 'csp' => 'enforce' in config.php, or TILES_CSP=enforce, once the console stays clean.
 */
function send_security_headers(): void
{
    $mode = (string) (getenv('TILES_CSP') ?: (tiles_private_config()['csp'] ?? 'report'));
    if ($mode !== 'off') {
        header(($mode === 'enforce' ? 'Content-Security-Policy: ' : 'Content-Security-Policy-Report-Only: ') . csp_policy(csp_nonce()));
    }
    if (is_https()) {
        // 180 days, this host only: subdomains keep their own policy.
        header('Strict-Transport-Security: max-age=15552000');
    }
}

function e(string $s): string
{
    return htmlspecialchars($s, ENT_QUOTES, 'UTF-8');
}

function asset_v(string $file): string
{
    return (string) @filemtime(PUBLIC_DIR . '/assets/' . $file);
}

/** Output the full HTML document: the same markup and script power the public page and the editor. */
function render_shell(string $title, string $description, array $boot, string $extraHead = '', string $noscript = ''): void
{
    $boot['sports'] = widget_catalogue();
    header('Content-Type: text/html; charset=utf-8');
    header('X-Content-Type-Options: nosniff');
    header('Referrer-Policy: strict-origin-when-cross-origin');
    send_security_headers();
    $bootJson = json_encode(
        $boot,
        JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
    );
    ?><!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title><?= e($title) ?></title>
<meta name="description" content="<?= e($description) ?>">
<?= $extraHead ?>
<link rel="preload" href="assets/fonts/figtree-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="assets/fonts/fonts.css?v=<?= asset_v('fonts/fonts.css') ?>">
<link rel="stylesheet" href="assets/css/app.css?v=<?= asset_v('css/app.css') ?>">
<link rel="stylesheet" href="assets/css/widgets.css?v=<?= asset_v('css/widgets.css') ?>">
<link rel="stylesheet" href="assets/css/experience.css?v=<?= asset_v('css/experience.css') ?>">
<link rel="stylesheet" href="assets/css/hub.css?v=<?= asset_v('css/hub.css') ?>">
<link rel="stylesheet" href="assets/css/polish.css?v=<?= asset_v('css/polish.css') ?>">
<link rel="stylesheet" href="assets/css/bento.css?v=<?= asset_v('css/bento.css') ?>">
<!-- Deferred: fetched in parallel with the markup, run in this order after TILES_BOOT. -->
<script defer src="assets/js/widgets.js?v=<?= asset_v('js/widgets.js') ?>"></script>
<script defer src="assets/js/experience.js?v=<?= asset_v('js/experience.js') ?>" data-qr="assets/vendor/qrcode.min.js?v=<?= asset_v('vendor/qrcode.min.js') ?>"></script>
<script defer src="assets/js/hub.js?v=<?= asset_v('js/hub.js') ?>"></script>
<script defer src="assets/js/polish.js?v=<?= asset_v('js/polish.js') ?>"></script>
<script defer src="assets/js/bento.js?v=<?= asset_v('js/bento.js') ?>"></script>
<?php if (($boot['mode'] ?? '') === 'admin'): ?><script defer src="assets/js/editor.js?v=<?= asset_v('js/editor.js') ?>"></script><?php endif; ?>
<script defer src="assets/js/app.js?v=<?= asset_v('js/app.js') ?>"></script>
</head>
<body>
<?php readfile(__DIR__ . '/templates/markup.html'); ?>
<?= $noscript ?>
<script nonce="<?= csp_nonce() ?>">window.TILES_BOOT=<?= $bootJson ?>;</script>
</body>
</html>
<?php
}


/**
 * In "admin" mode the public pages live on site_url: send visitors there with the same path (301).
 * Only a validated path is reused (never the Host or a full URL from the request), so this cannot become an open redirect.
 */
function redirect_public_to_site(): void
{
    if (TILES_MODE !== 'admin') { return; }
    $site = widget_settings()['site_url'];
    if ($site === '') { return; }
    $path = (string) (parse_url((string) ($_SERVER['REQUEST_URI'] ?? '/'), PHP_URL_PATH) ?: '/');
    if (!preg_match('#\A/[A-Za-z0-9._~/-]{0,200}\z#', $path) || str_contains($path, '//') || str_contains($path, '..')) { $path = '/'; }
    if ($path === '/index.php') { $path = '/'; }
    header('Location: ' . $site . $path, true, 301);
    header('Cache-Control: public, max-age=3600');
    exit;
}
