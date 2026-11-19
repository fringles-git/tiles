<?php
declare(strict_types=1);
require dirname(__DIR__) . '/src/lib.php';
require dirname(__DIR__) . '/src/leap.php';

header('Cache-Control: no-store');
header('X-Robots-Tag: noindex, nofollow');
header('X-Content-Type-Options: nosniff');

$id = (string) ($_GET['id'] ?? '');
$target = leap_target(read_json('page.json', []), $id, time());
if ($target === null || !in_array($_SERVER['REQUEST_METHOD'] ?? '', ['GET', 'HEAD'], true)) {
    http_response_code(404);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Not found';
    exit;
}
if (leap_countable((string) $_SERVER['REQUEST_METHOD'], $_SERVER)) {
    with_lock('stats', static function () use ($id): void {
        $st = read_json('stats.json', ['views' => 0, 'days' => [], 'clicks' => []]);
        $st['clicks'][$id] = (int) ($st['clicks'][$id] ?? 0) + 1;
        $st['go'][$id] = (int) ($st['go'][$id] ?? 0) + 1;
        write_json('stats.json', $st);
    });
}
header('Location: ' . $target, true, 302);
