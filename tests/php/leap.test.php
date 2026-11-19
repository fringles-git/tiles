<?php
declare(strict_types=1);
require dirname(__DIR__, 2) . '/src/leap.php';
function check(bool $condition, string $message): void { if (!$condition) { throw new RuntimeException($message); } echo "PASS: $message\n"; }
$now = strtotime('2026-11-19 12:00:00 UTC');
$tile = static fn(string $id, array $extra = [], string $url = 'https://example.test/a?x=1') => ['id' => $id, 'type' => 'link', 'data' => ['url' => $url]] + $extra;
$page = ['tiles' => [
    $tile('ok'), $tile('hidden', ['hidden' => true]), $tile('future', ['start' => '2026-12-01']), $tile('past', ['end' => '2026-11-18']),
    $tile('today', ['start' => '2026-11-19', 'end' => '2026-11-19']), $tile('js', [], 'javascript:alert(1)'), $tile('data', [], 'data:text/html,x'),
    $tile('creds', [], 'https://user:pass@example.test/'), $tile('space', [], "https://example.test/a b"), $tile('bad-date', ['start' => 'soon']),
    $tile('nourl', [], ''), ['id' => 'section-1', 'type' => 'section', 'data' => ['title' => 'S']],
]];
check(leap_target($page, 'ok', $now) === 'https://example.test/a?x=1', 'visible tile URL returned unchanged');
check(leap_target($page, 'today', $now) === 'https://example.test/a?x=1', 'schedule window inclusive of today');
foreach (['hidden', 'future', 'past', 'js', 'data', 'creds', 'space', 'bad-date', 'nourl', 'section-1', 'missing', '../etc', 'UPPER', str_repeat('a', 25)] as $id) {
    check(leap_target($page, $id, $now) === null, "refused: $id");
}
check(leap_countable('GET', ['HTTP_USER_AGENT' => 'Mozilla/5.0 (iPhone)']), 'browser visit counted');
check(!leap_countable('HEAD', []), 'HEAD not counted');
check(!leap_countable('GET', ['HTTP_USER_AGENT' => 'facebookexternalhit/1.1']), 'link preview not counted');
check(!leap_countable('GET', ['HTTP_SEC_PURPOSE' => 'prefetch;prerender']), 'prefetch not counted');
