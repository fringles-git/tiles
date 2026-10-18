<?php
declare(strict_types=1);

ini_set('display_errors', '0');
error_reporting(E_ALL);

const DATA_DIR = __DIR__ . '/data';
const UPLOAD_DIR = __DIR__ . '/uploads';
const SEED_DIR = __DIR__ . '/seed';

// Refuse to run as a nested copy of the app (for example a stray clone in a subfolder).
if (is_file(dirname(__DIR__) . '/lib.php') && is_file(dirname(__DIR__) . '/assets/app.js')) {
    http_response_code(404);
    exit;
}

/**
 * First run: copy the starting content out of seed/ into data/ and uploads/.
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
        if (!is_file(DATA_DIR . '/' . $f) && is_file(SEED_DIR . '/' . $f)) {
            @copy(SEED_DIR . '/' . $f, DATA_DIR . '/' . $f);
        }
    }
    if (!is_file(DATA_DIR . '/.seeded')) {
        foreach (glob(SEED_DIR . '/uploads/*') ?: [] as $img) {
            $dest = UPLOAD_DIR . '/' . basename($img);
            if (!is_file($dest)) {
                @copy($img, $dest);
            }
        }
        @file_put_contents(DATA_DIR . '/.seeded', gmdate('c'));
    }

    // One-time content updates shipped with the code (seed/patches/*.json), applied once each.
    $patches = glob(SEED_DIR . '/patches/*.json') ?: [];
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

function is_https(): bool
{
    return (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
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
    $st = read_json('stats.json', []);
    $days = [];
    for ($i = 13; $i >= 0; $i--) {
        $key = gmdate('Y-m-d', time() - $i * 86400);
        $days[] = (int) ($st['days'][$key] ?? 0);
    }
    $leads = array_map(fn($l) => (string) ($l['email'] ?? ''), read_json('leads.json', []));
    return [
        'sample' => false,
        'views' => (int) ($st['views'] ?? 0),
        'days' => $days,
        'clicks' => (object) ($st['clicks'] ?? []),
        'leads' => array_values($leads),
    ];
}

function e(string $s): string
{
    return htmlspecialchars($s, ENT_QUOTES, 'UTF-8');
}

function asset_v(string $file): string
{
    return (string) @filemtime(__DIR__ . '/assets/' . $file);
}

/** Output the full HTML document: the same markup and script power the public page and the editor. */
function render_shell(string $title, string $description, array $boot, string $extraHead = '', string $noscript = ''): void
{
    header('Content-Type: text/html; charset=utf-8');
    header('X-Content-Type-Options: nosniff');
    header('Referrer-Policy: strict-origin-when-cross-origin');
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
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..800&family=Figtree:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;600&display=swap">
<link rel="stylesheet" href="assets/app.css?v=<?= asset_v('app.css') ?>">
</head>
<body>
<?php readfile(__DIR__ . '/assets/markup.html'); ?>
<?= $noscript ?>
<script>window.TILES_BOOT=<?= $bootJson ?>;</script>
<script src="assets/app.js?v=<?= asset_v('app.js') ?>"></script>
</body>
</html>
<?php
}
