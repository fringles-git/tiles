<?php
declare(strict_types=1);
require dirname(__DIR__) . '/widget-cache.php';
function check(bool $condition, string $message): void { if (!$condition) { throw new RuntimeException($message); } echo "PASS: $message\n"; }
$now = strtotime('2026-11-06 12:00:00 UTC');
$state = [];
for ($i = 0; $i < 24; $i++) { $r = widget_reserve($state, 'jolpica', $now + $i * 3); check($r['allowed'], 'sports request ' . ($i + 1) . ' reserved'); $state = $r['state']; }
check(!widget_reserve($state, 'jolpica', $now + 100)['allowed'], 'daily hard stop');
$first = widget_reserve([], 'radio', $now);
check(!widget_reserve($first['state'], 'radio', $now + 1)['allowed'], 'burst prevented');
check(widget_reserve($state, 'jolpica', $now + 86400)['allowed'], 'UTC daily reset');
$dir = sys_get_temp_dir() . '/tiles-widget-test-' . bin2hex(random_bytes(5));
$calls = 0;
$fetch = function (string $url) use (&$calls): array { $calls++; return ['MRData' => ['RaceTable' => ['season' => '2026', 'Races' => []]]]; };
try {
    check(!widget_cached('https://example.com', $dir, $fetch, $now)['ok'] && $calls === 0, 'arbitrary endpoints refused');
    $one = widget_cached('f1-calendar', $dir, $fetch, $now);
    $two = widget_cached('f1-calendar', $dir, $fetch, $now + 10);
    check($one['ok'] && $two['ok'] && $calls === 1, 'cache shared across visitors');
    $failed = function (): array { throw new RuntimeException('throttled', 172800); };
    $stale = widget_cached('f1-calendar', $dir, $failed, $now + 4000);
    check($stale['ok'] && $stale['stale'], 'stale data used after failure');
    $usage = json_decode(file_get_contents($dir . '/usage.json'), true);
    check($usage['jolpica']['count'] === 2 && $usage['jolpica']['next'] === $now + 4000 + 172800, 'failed attempts counted and Retry-After retained');
    widget_cached('f1-standings', $dir, $fetch, $now + 4010);
    check($calls === 1, 'cooldown shared across resources');
    putenv('TILES_WIDGETS_OFF=1');
    widget_cached('radio-gospel', $dir, $fetch, $now + 86400);
    check($calls === 1, 'kill switch sends no requests');
    putenv('TILES_WIDGETS_OFF');
    file_put_contents($dir . '/usage.json', '{corrupted');
    check(!widget_cached('radio-jazz', $dir, $fetch, $now + 86400)['ok'] && $calls === 1, 'corrupt counters fail closed');
    $station = widget_normalize('radio-gospel', [['url_resolved' => 'http://insecure.test', 'lastcheckok' => 1], ['url_resolved' => 'https://stream.example.test/live', 'lastcheckok' => 1, 'hls' => 0]]);
    check(count($station['items']) === 1, 'only HTTPS audio retained');
} finally { foreach (glob($dir . '/*') ?: [] as $file) { unlink($file); } if (is_dir($dir)) { rmdir($dir); } }
