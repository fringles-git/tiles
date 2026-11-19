<?php
declare(strict_types=1);

/**
 * Leap links: /go/<tile-id> counts the visit, then redirects to that tile's own URL.
 * The destination is never taken from the request: only a stored, visible tile URL is used.
 */
function leap_target(array $page, string $id, int $now): ?string
{
    if (!preg_match('/^[a-z0-9-]{1,24}$/', $id)) { return null; }
    foreach (($page['tiles'] ?? []) as $tile) {
        if (!is_array($tile) || ($tile['id'] ?? null) !== $id) { continue; }
        if (!empty($tile['hidden'])) { return null; }
        // Same scheduling window as the page (UTC day boundaries).
        foreach (['start' => 'T00:00:00Z', 'end' => 'T23:59:59Z'] as $key => $time) {
            $day = (string) ($tile[$key] ?? '');
            if ($day === '') { continue; }
            $at = preg_match('/^\d{4}-\d{2}-\d{2}$/', $day) ? strtotime($day . $time) : false;
            if ($at === false || ($key === 'start' ? $at > $now : $at < $now)) { return null; }
        }
        $url = trim((string) (($tile['data'] ?? [])['url'] ?? ''));
        if (strlen($url) > 2048 || !preg_match('#^https?://[^\s\x00-\x1f\x7f]+$#i', $url)) { return null; }
        $parts = parse_url($url);
        if (!is_array($parts) || empty($parts['host']) || isset($parts['user']) || isset($parts['pass'])) { return null; }
        return $url;
    }
    return null;
}

/** Prefetchers, link previews and HEAD probes must not inflate the counters. */
function leap_countable(string $method, array $server): bool
{
    if ($method !== 'GET') { return false; }
    if (stripos((string) ($server['HTTP_SEC_PURPOSE'] ?? $server['HTTP_PURPOSE'] ?? ''), 'prefetch') !== false) { return false; }
    return !preg_match('/bot|crawl|spider|preview|facebookexternalhit|slackbot|whatsapp|telegram|curl|wget/i', (string) ($server['HTTP_USER_AGENT'] ?? ''));
}
