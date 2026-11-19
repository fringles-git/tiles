<?php
declare(strict_types=1);

// Tiles uses PHP 8.5 features (URI extension, array_last). Fail with a clear message instead of a fatal error.
if (PHP_VERSION_ID < 80500) {
    if (PHP_SAPI !== 'cli') { http_response_code(500); header('Content-Type: text/plain; charset=utf-8'); }
    echo 'Tiles requires PHP 8.5 or later (running ' . PHP_VERSION . ').' . PHP_EOL;
    exit(1);
}
require_once __DIR__ . '/url.php';

// Stable application paths: the document root and process cwd never own private data.
define('ROOT_DIR', dirname(__DIR__));
define('PUBLIC_DIR', ROOT_DIR . '/public');
define('DATA_DIR', getenv('TILES_DATA_DIR') ?: ROOT_DIR . '/data');
define('UPLOAD_DIR', getenv('TILES_UPLOAD_DIR') ?: ROOT_DIR . '/uploads');
define('SEED_DATA_DIR', ROOT_DIR . '/seed/data');
define('SEED_UPLOAD_DIR', ROOT_DIR . '/seed/uploads');
