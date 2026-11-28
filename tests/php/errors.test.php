<?php
declare(strict_types=1);
$tmp = sys_get_temp_dir() . '/tiles-errors-' . bin2hex(random_bytes(4));
mkdir($tmp);
putenv('TILES_DATA_DIR=' . $tmp);
putenv('TILES_UPLOAD_DIR=' . $tmp . '/uploads');
// widgets.php only loads widget-cache.php: error handling must already be active through paths.php.
require dirname(__DIR__, 2) . '/src/widget-cache.php';
$widgetsLog = ini_get('error_log');
$handler = set_exception_handler(null);
set_exception_handler($handler);
require dirname(__DIR__, 2) . '/src/lib.php';
function check(bool $condition, string $message): void { if (!$condition) { throw new RuntimeException($message); } echo "PASS: $message\n"; }

$log = DATA_DIR . '/logs/php-error.log';
check(ini_get('error_log') === $log && ini_get('log_errors') === '1', 'errors logged to a private file under data/');
check($widgetsLog === $log && $handler === 'tiles_fail', 'widgets endpoint chain logs and handles exceptions too');

tiles_log("line one\nforged line", ['file' => 'x.json']);
$text = (string) file_get_contents($log);
check(str_contains($text, '[tiles] line one forged line {"file":"x.json"}'), 'log line written on one line with context');

$thrown = false;
try { with_lock('missing-dir/x', fn () => 'ran'); } catch (RuntimeException $e) { $thrown = str_contains($e->getMessage(), 'Lock file unavailable'); }
check($thrown, 'with_lock throws when the lock file cannot be opened');
check(with_lock('ok', fn () => 'ran') === 'ran', 'with_lock still runs and returns normally');

check(write_json('missing-dir/page.json', ['a' => 1]) === false, 'write_json reports a failed write');
check(str_contains((string) file_get_contents($log), '"file":"missing-dir/page.json","step":"write"'), 'failed write is logged');

file_put_contents($log, str_repeat('x', 1024 * 1024 + 1));
tiles_log_file();
check(is_file($log . '.1') && !is_file($log), 'log rotated past 1 MB');

exec('rm -rf ' . escapeshellarg($tmp));
