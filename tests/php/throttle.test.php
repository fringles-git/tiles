<?php
declare(strict_types=1);
$tmp = sys_get_temp_dir() . '/tiles-throttle-' . bin2hex(random_bytes(4));
mkdir($tmp);
putenv('TILES_DATA_DIR=' . $tmp);
putenv('TILES_UPLOAD_DIR=' . $tmp . '/uploads');
require dirname(__DIR__, 2) . '/src/lib.php';
function check(bool $condition, string $message): void { if (!$condition) { throw new RuntimeException($message); } echo "PASS: $message\n"; }

$s = ['hits' => []];
for ($i = 0; $i < 3; $i++) { [$ok, $s] = throttle_step($s, 'k', 3, 60, 1000, true); check($ok, 'event ' . ($i + 1) . ' of 3 allowed'); }
[$ok, $s] = throttle_step($s, 'k', 3, 60, 1001, true);
check(!$ok && $s['hits']['k'][1] === 3, 'fourth event refused and not counted');
[$ok] = throttle_step($s, 'other', 3, 60, 1001, true);
check($ok, 'another client is not affected');
[$ok, $s] = throttle_step($s, 'k', 3, 60, 1060, false);
check($ok && !isset($s['hits']['k']), 'window expiry frees the client and prunes its entry');

for ($i = 0; $i < 5; $i++) { throttle('login-fail', 5, 600, true, '198.51.100.7'); }
check(!throttle('login-fail', 5, 600, false, '198.51.100.7'), 'attacker blocked after 5 failures');
check(throttle('login-fail', 5, 600, false, '203.0.113.20'), 'the real admin, on another address, can still log in');
$raw = (string) file_get_contents(DATA_DIR . '/throttle-login-fail.json');
check(!str_contains($raw, '198.51.100.7'), 'client address never stored');

exec('rm -rf ' . escapeshellarg($tmp));
