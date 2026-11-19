<?php
declare(strict_types=1);

/**
 * Record one hit in the stats array (pure: no I/O, testable).
 * Views and clicks keep a per-day series for 120 days; click totals stay all-time.
 */
function stats_record(array $st, string $type, string $id, int $now, bool $viaGo = false): array
{
    foreach (['days', 'clicks', 'clickDays', 'go'] as $key) {
        if (!is_array($st[$key] ?? null)) { $st[$key] = []; }
    }
    $day = gmdate('Y-m-d', $now);
    $cut = gmdate('Y-m-d', $now - 120 * 86400);
    $keep = static fn(array $series): array => array_filter($series, static fn($k) => is_string($k) && $k >= $cut, ARRAY_FILTER_USE_KEY);
    if ($type === 'view') {
        $st['views'] = (int) ($st['views'] ?? 0) + 1;
        $st['days'][$day] = (int) ($st['days'][$day] ?? 0) + 1;
        $st['days'] = $keep($st['days']);
        return $st;
    }
    $st['clicks'][$id] = (int) ($st['clicks'][$id] ?? 0) + 1;
    if (!is_array($st['clickDays'][$day] ?? null)) { $st['clickDays'][$day] = []; }
    $st['clickDays'][$day][$id] = (int) ($st['clickDays'][$day][$id] ?? 0) + 1;
    $st['clickDays'] = $keep($st['clickDays']);
    if ($viaGo) { $st['go'][$id] = (int) ($st['go'][$id] ?? 0) + 1; }
    return $st;
}

/** Last $n days (oldest first) of views and of clicks per block, for the editor. */
function stats_window(array $st, int $now, int $n = 30): array
{
    $days = [];
    $clickDays = [];
    for ($i = $n - 1; $i >= 0; $i--) {
        $key = gmdate('Y-m-d', $now - $i * 86400);
        $days[] = (int) ($st['days'][$key] ?? 0);
        $row = $st['clickDays'][$key] ?? [];
        $clickDays[] = (object) (is_array($row) ? array_map('intval', $row) : []);
    }
    return ['days' => $days, 'clickDays' => $clickDays];
}
