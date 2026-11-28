<?php
declare(strict_types=1);
// PHPStan only: the runtime constants from src/paths.php, without running its side effects
// (config loading, error-log setup, version gate).
define('ROOT_DIR', dirname(__DIR__, 2));
define('PUBLIC_DIR', ROOT_DIR . '/public');
define('DATA_DIR', ROOT_DIR . '/data');
define('UPLOAD_DIR', ROOT_DIR . '/uploads');
define('SEED_DATA_DIR', ROOT_DIR . '/seed/data');
define('SEED_UPLOAD_DIR', ROOT_DIR . '/seed/uploads');
define('TILES_MODE', 'full');
