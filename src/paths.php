<?php
declare(strict_types=1);

// Stable application paths: the document root and process cwd never own private data.
define('ROOT_DIR', dirname(__DIR__));
define('PUBLIC_DIR', ROOT_DIR . '/public');
define('DATA_DIR', getenv('TILES_DATA_DIR') ?: ROOT_DIR . '/data');
define('UPLOAD_DIR', getenv('TILES_UPLOAD_DIR') ?: ROOT_DIR . '/uploads');
define('SEED_DATA_DIR', ROOT_DIR . '/seed/data');
define('SEED_UPLOAD_DIR', ROOT_DIR . '/seed/uploads');
