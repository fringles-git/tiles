<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require dirname(__DIR__) . '/src/lib.php';
if (!empty(read_json('auth.json', [])['hash'])) {
    fwrite(STDERR, "An administrator already exists. Use the editor to change its password.\n"); exit(1);
}
fwrite(STDERR, "New admin password (stdin; 10+ characters):\n");
$password = rtrim((string) fgets(STDIN), "\r\n");
if (strlen($password) < 10) { fwrite(STDERR, "Use at least 10 characters.\n"); exit(1); }
$ok = with_lock('auth', static function () use ($password): bool {
    if (!empty(read_json('auth.json', [])['hash'])) { return false; }
    return write_json('auth.json', ['hash' => password_hash($password, PASSWORD_DEFAULT)]);
});
if (!$ok) { fwrite(STDERR, "Administrator was not changed.\n"); exit(1); }
fwrite(STDOUT, "Administrator created.\n");
