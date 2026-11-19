<?php
declare(strict_types=1);
require dirname(__DIR__, 2) . '/src/widget-cache.php';
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

$calendar = widget_normalize('f1-calendar', ['MRData' => ['RaceTable' => ['Races' => [['raceName'=>'Test', 'date'=>'2099-01-03', 'FirstPractice'=>['date'=>'2099-01-01', 'time'=>'09:00:00Z'], 'Qualifying'=>['date'=>'2099-01-02']]]]]]);
check($calendar['items'][0]['sessions'][0]['name'] === 'Essais 1', 'practice sessions preserved');
check($calendar['items'][0]['sessions'][1]['time'] === '', 'unknown qualifying time remains unknown');
$results = widget_normalize('f1-results', ['MRData'=>['RaceTable'=>['Races'=>[['raceName'=>'Test','Results'=>[['Driver'=>['driverId'=>'max_verstappen','givenName'=>'Max','familyName'=>'Verstappen'],'position'=>'2','status'=>'Finished']]]]]]]);
check($results['items'][0]['results'][0]['driverId'] === 'max_verstappen' && $results['items'][0]['results'][0]['position'] === '2', 'last-race driver identity and finish retained');

$constructors = widget_normalize('f1-constructors', ['MRData' => ['StandingsTable' => ['season' => '2026', 'StandingsLists' => [['ConstructorStandings' => [['position' => '1', 'points' => '652', 'wins' => '12', 'Constructor' => ['constructorId' => 'mercedes', 'name' => 'Mercedes']]]]]]]]);
check($constructors['items'][0]['id'] === 'mercedes' && $constructors['items'][0]['points'] === '652', 'constructor standings normalized');
$drivers = widget_normalize('f1-standings', ['MRData' => ['StandingsTable' => ['StandingsLists' => [['DriverStandings' => [['position' => '1', 'points' => '390', 'wins' => '9', 'Driver' => ['driverId' => 'antonelli', 'code' => 'ANT', 'givenName' => 'Kimi', 'familyName' => 'Antonelli'], 'Constructors' => [['constructorId' => 'rb', 'name' => 'RB'], ['constructorId' => 'mercedes', 'name' => 'Mercedes']]]]]]]]]);
check($drivers['items'][0]['id'] === 'antonelli' && $drivers['items'][0]['teamId'] === 'mercedes', 'driver id kept and current team is the last listed');
$live = widget_normalize('f1-live', ['events' => [['name' => 'GP', 'competitions' => [['type' => ['abbreviation' => 'FP1'], 'date' => '2026-11-20T00:30Z', 'status' => ['type' => ['state' => 'in']]], ['type' => ['abbreviation' => 'FP2'], 'status' => ['type' => ['state' => '<script>']]]]]]]);
check($live['items'][0]['state'] === 'in' && $live['items'][1]['state'] === 'pre' && $live['source'] === 'ESPN', 'ESPN session states whitelisted');
$threw = false; try { widget_normalize('f1-live', ['nope' => 1]); } catch (RuntimeException $e) { $threw = true; }
check($threw, 'invalid ESPN payload rejected');
$state = []; $granted = 0;
for ($i = 0; $i < 600; $i++) { $r = widget_reserve($state, 'espn', $now + $i * 3); if ($r['allowed']) { $granted++; $state = $r['state']; } }
check($granted === 480, 'ESPN has its own daily hard stop');
check(widget_reserve([], 'jolpica', $now)['allowed'], 'ESPN budget does not consume Jolpica quota');
