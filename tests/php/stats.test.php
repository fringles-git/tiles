<?php
declare(strict_types=1);
require dirname(__DIR__, 2) . '/src/stats.php';
function check(bool $condition, string $message): void { if (!$condition) { throw new RuntimeException($message); } echo "PASS: $message\n"; }
$now = gmmktime(12, 0, 0, 11, 19, 2026);
$st = stats_record([], 'view', '', $now);
$st = stats_record($st, 'click', 'abc', $now);
$st = stats_record($st, 'click', 'abc', $now, true);
$st = stats_record($st, 'click', 'p-cv', $now - 86400);
check($st['views'] === 1 && $st['days']['2026-11-19'] === 1, 'views count per day');
check($st['clicks']['abc'] === 2 && $st['clickDays']['2026-11-19']['abc'] === 2 && $st['go']['abc'] === 1, 'clicks keep an all-time total, a daily series and /go/ count');
$old = stats_record(['clickDays' => ['2026-01-01' => ['x' => 9]], 'days' => ['2026-01-01' => 3]], 'click', 'abc', $now);
check(!isset($old['clickDays']['2026-01-01']) && isset($old['days']['2026-01-01']), 'click series older than 120 days is pruned');
check(!isset(stats_record(['clickDays' => 'bad'], 'click', 'a', $now)['clickDays']['bad']), 'malformed series is replaced');
$w = stats_window($st, $now, 30);
check(count($w['days']) === 30 && $w['days'][29] === 1 && ((array) $w['clickDays'][28])['p-cv'] === 1 && ((array) $w['clickDays'][29])['abc'] === 2, 'window returns 30 aligned days, oldest first');
check(json_encode(stats_window([], $now, 2)['clickDays']) === '[{},{}]', 'empty days encode as objects, not arrays');
$bad = stats_record(['views' => 'x', 'days' => 'x', 'clicks' => 3, 'clickDays' => ['2026-11-19' => 'x'], 'go' => null], 'click', 'a', $now, true);
check($bad['clicks']['a'] === 1 && $bad['clickDays']['2026-11-19']['a'] === 1 && $bad['go']['a'] === 1, 'corrupted stats file never breaks recording');
check(stats_record(['days' => 'x'], 'view', '', $now)['days']['2026-11-19'] === 1, 'corrupted view series is reset');
