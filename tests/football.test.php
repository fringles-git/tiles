<?php
declare(strict_types=1);
require dirname(__DIR__) . '/widget-cache.php';
function expect(bool $ok, string $message): void { if (!$ok) { throw new RuntimeException($message); } echo "PASS $message\n"; }
$now = strtotime('2026-11-07 12:00 UTC');
$first = widget_reserve([], 'football', $now);
expect($first['allowed'], 'first football request permitted');
expect(!widget_reserve($first['state'], 'football', $now + 6)['allowed'], 'seven second shared spacing');
expect(widget_reserve($first['state'], 'football', $now + 7)['allowed'], 'spacing releases');
$state = [];for ($i=0;$i<24;$i++) { $state = widget_reserve($state, 'football', $now + $i*8)['state']; }
expect(!widget_reserve($state, 'football', $now + 300)['allowed'], '24 request hard stop for all clubs');
$result = widget_normalize('football-psg', ['matches' => [
    ['competition'=>['code'=>'FL1','name'=>'Ligue 1'],'utcDate'=>'2026-11-07T20:00:00Z','status'=>'SCHEDULED','homeTeam'=>['name'=>'PSG'],'awayTeam'=>['name'=>'Adversaire'],'score'=>['fullTime'=>['home'=>null,'away'=>null]]],
    ['competition'=>['code'=>'UNL','name'=>'Nations League'],'utcDate'=>'2026-11-08T20:00:00Z'],
]]);
expect(count($result['items'])===1 && $result['items'][0]['homeScore']===null, 'uncovered matches excluded and null is not zero');
putenv('FOOTBALL_DATA_TOKEN=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA');
expect(widget_settings()['football_token']!=='', 'server token loaded');
expect(!str_contains(json_encode(widget_catalogue()),'AAAAAAAA'), 'public catalogue never contains token');
putenv('FOOTBALL_DATA_TOKEN');
expect(!isset(widget_resources()['football-unknown']), 'unregistered teams cannot create cache keys');
