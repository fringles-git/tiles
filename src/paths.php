<?php
declare(strict_types=1);

// Stable application paths: the document root and process cwd never own private data.
define('ROOT_DIR', dirname(__DIR__));
define('PUBLIC_DIR', ROOT_DIR . '/public');

/** Deployment settings from the private config file (never sent to the browser). */
function tiles_private_config(): array
{
    static $cfg = null;
    if ($cfg !== null) { return $cfg; }
    $file = getenv('TILES_CONFIG_FILE') ?: (is_file(ROOT_DIR . '/config/config.php') ? ROOT_DIR . '/config/config.php' : ROOT_DIR . '/config.local.php');
    $cfg = [];
    if (is_file($file)) {
        ob_start();
        try { $cfg = require $file; } catch (Throwable) { $cfg = []; } finally { ob_end_clean(); }
    }
    return $cfg = is_array($cfg) ? $cfg : [];
}
$cfgDir = static fn(string $key): string => is_string(tiles_private_config()[$key] ?? null) && is_dir(tiles_private_config()[$key]) ? rtrim(tiles_private_config()[$key], '/') : '';
define('DATA_DIR', getenv('TILES_DATA_DIR') ?: ($cfgDir('data_dir') ?: ROOT_DIR . '/data'));
define('UPLOAD_DIR', getenv('TILES_UPLOAD_DIR') ?: ($cfgDir('upload_dir') ?: ROOT_DIR . '/uploads'));
/**
 * full   : page and admin on the same domain (default).
 * public : page only (brandonlazarre.fr); admin and editor endpoints answer 404. Shares data_dir with the admin install.
 * admin  : admin only (tiles.brandonlazarre.fr); public pages redirect (301) to site_url.
 */
$mode = (string) (getenv('TILES_MODE') ?: (tiles_private_config()['mode'] ?? 'full'));
define('TILES_MODE', in_array($mode, ['full', 'public', 'admin'], true) ? $mode : 'full');
unset($cfgDir, $mode);
define('SEED_DATA_DIR', ROOT_DIR . '/seed/data');
define('SEED_UPLOAD_DIR', ROOT_DIR . '/seed/uploads');
