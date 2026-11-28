<?php
declare(strict_types=1);

/*
 * Per-client rate limits for public writes and login, in small JSON files under data/.
 * The client address is never stored: keys are an HMAC of bucket + address with a secret
 * that changes every day, as for the visitor counts in stats.php.
 */

/**
 * Count one event (pure). Returns [allowed, state].
 * $consume = false only checks: allowed while the count is under $limit.
 * $consume = true counts the event unless the limit is already reached.
 */
function throttle_step(array $state, string $key, int $limit, int $window, int $now, bool $consume): array
{
    $hits = is_array($state['hits'] ?? null) ? $state['hits'] : [];
    foreach ($hits as $k => $hit) {
        if (!is_array($hit) || ($hit[0] ?? 0) + $window <= $now) { unset($hits[$k]); }
    }
    $count = (int) ($hits[$key][1] ?? 0);
    $allowed = $count < $limit;
    if ($consume && $allowed) {
        $hits[$key] = [(int) ($hits[$key][0] ?? $now), $count + 1];
    }
    // A flood of distinct addresses cannot grow the file without bound: oldest windows go first.
    if (count($hits) > 20000) {
        uasort($hits, fn ($a, $b) => $a[0] <=> $b[0]);
        $hits = array_slice($hits, -20000, null, true);
    }
    $state['hits'] = $hits;
    return [$allowed, $state];
}

/** Daily secret for the keys (pure, like stats_salt). */
function throttle_secret(array $state, int $now): array
{
    $day = gmdate('Y-m-d', $now);
    if (($state['day'] ?? '') !== $day || !is_string($state['secret'] ?? null) || strlen($state['secret']) !== 64) {
        $state = ['day' => $day, 'secret' => bin2hex(random_bytes(32)), 'hits' => []];
    }
    return $state;
}

/** True when this client is under $limit events per $window seconds for $bucket. */
function throttle(string $bucket, int $limit, int $window, bool $consume = true, ?string $client = null): bool
{
    $client ??= (string) ($_SERVER['REMOTE_ADDR'] ?? '');
    return with_lock('throttle-' . $bucket, function () use ($bucket, $limit, $window, $consume, $client): bool {
        $file = 'throttle-' . $bucket . '.json';
        $now = time();
        $state = throttle_secret(read_json($file, []), $now);
        $key = substr(hash_hmac('sha256', $bucket . '|' . $client, $state['secret']), 0, 24);
        [$allowed, $next] = throttle_step($state, $key, $limit, $window, $now, $consume);
        if ($next !== $state) { write_json($file, $next); }
        return $allowed;
    });
}
