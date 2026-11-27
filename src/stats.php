<?php
declare(strict_types=1);

/**
 * Record one hit in the stats array (pure: no I/O, testable).
 * Views and clicks keep a per-day series for 120 days; click totals stay all-time.
 */
function stats_record(array $st, string $type, string $id, int $now, bool $viaGo = false): array
{
    foreach (['days', 'clicks', 'clickDays', 'go', 'goDays'] as $key) {
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
    if ($viaGo) {
        $st['go'][$id] = (int) ($st['go'][$id] ?? 0) + 1;
        if (!is_array($st['goDays'][$day] ?? null)) { $st['goDays'][$day] = []; }
        $st['goDays'][$day][$id] = (int) ($st['goDays'][$day][$id] ?? 0) + 1;
        $st['goDays'] = $keep($st['goDays']);
    }
    return $st;
}

/**
 * Last $n days (oldest first) of views, clicks and /go/ visits per block, for the editor.
 * clickDays and goDays are null when no daily click series exists yet (data recorded before
 * per-day clicks), so the editor falls back to all-time totals and says so.
 */
function stats_window(array $st, int $now, int $n = 30): array
{
    $series = static function (mixed $src) use ($now, $n): ?array {
        if (!is_array($src) || $src === []) { return null; }
        $out = [];
        for ($i = $n - 1; $i >= 0; $i--) {
            $row = $src[gmdate('Y-m-d', $now - $i * 86400)] ?? [];
            $out[] = (object) (is_array($row) ? array_map('intval', $row) : []);
        }
        return $out;
    };
    $days = [];
    for ($i = $n - 1; $i >= 0; $i--) {
        $days[] = (int) ($st['days'][gmdate('Y-m-d', $now - $i * 86400)] ?? 0);
    }
    $clickDays = $series($st['clickDays'] ?? null);
    return ['days' => $days, 'clickDays' => $clickDays, 'goDays' => $clickDays === null ? null : ($series($st['goDays'] ?? null) ?? array_fill(0, $n, new stdClass()))];
}

/* ---------- Audience: unique visitors, sources and devices, without cookies ---------- */

/** Fixed source buckets: only one of these words is ever stored, never a referrer URL. */
const STATS_SOURCES = ['instagram', 'tiktok', 'facebook', 'x', 'linkedin', 'youtube', 'snapchat', 'pinterest', 'threads', 'whatsapp', 'telegram', 'github', 'search', 'ai', 'email', 'other', 'direct'];

/**
 * Traffic source of a page view. In-app browsers often send no referrer, so their user agent is
 * read first; then utm_source, then the referrer host. Unknown hosts collapse to "other".
 */
function stats_source(string $referrer, string $ua, string $utm = '', string $ownHost = ''): string
{
    $apps = ['instagram' => '/\bInstagram\b/i', 'facebook' => '/\bFBA[NV]\b|\bFB_IAB\b/', 'tiktok' => '/\b(?:TikTok|musical_ly|BytedanceWebview)\b/i',
        'linkedin' => '/\bLinkedInApp\b/i', 'snapchat' => '/\bSnapchat\b/i', 'pinterest' => '/\bPinterest\b/i', 'threads' => '/\bBarcelona\b/'];
    foreach ($apps as $key => $re) { if (preg_match($re, $ua)) { return $key; } }
    $hosts = ['instagram' => ['instagram.com'], 'facebook' => ['facebook.com', 'fb.com', 'fb.me', 'messenger.com'], 'tiktok' => ['tiktok.com'],
        'x' => ['x.com', 'twitter.com', 't.co'], 'linkedin' => ['linkedin.com', 'lnkd.in'], 'youtube' => ['youtube.com', 'youtu.be'],
        'snapchat' => ['snapchat.com'], 'pinterest' => ['pinterest.com', 'pinterest.fr', 'pin.it'], 'threads' => ['threads.net', 'threads.com'],
        'whatsapp' => ['whatsapp.com', 'wa.me'], 'telegram' => ['telegram.org', 't.me'], 'github' => ['github.com'],
        'search' => ['google.', 'bing.com', 'duckduckgo.com', 'qwant.com', 'ecosia.org', 'search.yahoo.com', 'search.brave.com', 'yandex.'],
        'ai' => ['chatgpt.com', 'chat.openai.com', 'perplexity.ai', 'claude.ai', 'gemini.google.com', 'copilot.microsoft.com', 'mistral.ai'],
        'email' => ['mail.google.com', 'outlook.live.com', 'outlook.office.com', 'mail.yahoo.com', 'mail.proton.me']];
    $match = static function (string $host) use ($hosts): ?string {
        $host = strtolower(trim($host, ". \t"));
        if ($host === '') { return null; }
        // Specific hosts (gemini.google.com, mail.google.com) win over the generic search rule.
        foreach (['ai', 'email'] as $first) { foreach ($hosts[$first] as $h) { if ($host === $h || str_ends_with($host, '.' . $h)) { return $first; } } }
        foreach ($hosts as $key => $list) {
            foreach ($list as $h) {
                if (str_ends_with($h, '.') ? (str_starts_with($host, $h) || str_contains($host, '.' . $h)) : ($host === $h || str_ends_with($host, '.' . $h))) { return $key; }
            }
        }
        return null;
    };
    $utm = strtolower(trim($utm));
    if ($utm !== '') {
        if (in_array($utm, STATS_SOURCES, true) && $utm !== 'direct') { return $utm; }
        $aliases = ['ig' => 'instagram', 'insta' => 'instagram', 'fb' => 'facebook', 'twitter' => 'x', 'li' => 'linkedin', 'yt' => 'youtube', 'tt' => 'tiktok', 'google' => 'search', 'newsletter' => 'email', 'mail' => 'email', 'chatgpt' => 'ai'];
        return $aliases[$utm] ?? ($match($utm) ?? 'other');
    }
    $referrer = trim($referrer);
    if ($referrer === '' || strlen($referrer) > 2048) { return 'direct'; }
    $host = (string) (preg_match('#\Ahttps?://([^/:?\#@]+)#i', $referrer, $m) ? $m[1] : '');
    if ($host === '') { return 'direct'; }
    if ($ownHost !== '' && strcasecmp($host, $ownHost) === 0) { return 'direct'; }
    return $match($host) ?? 'other';
}

/** Coarse device class from the user agent: mobile, tablet or desktop. */
function stats_device(string $ua): string
{
    if (preg_match('/iPad|Tablet|PlayBook|Silk|Kindle|Android(?!.*Mobile)/i', $ua)) { return 'tablet'; }
    if (preg_match('/Mobi|iPhone|iPod|Android|Windows Phone/i', $ua)) { return 'mobile'; }
    return 'desktop';
}

/** Crawlers, link previews and headless browsers are not visitors. */
function stats_is_bot(string $ua): bool
{
    return $ua === '' || preg_match('/bot|crawl|spider|slurp|preview|facebookexternalhit|embedly|headless|lighthouse|pingdom|curl|wget|python-requests|httpclient/i', $ua) === 1;
}

/**
 * One-way visitor key for one day. The salt is random and replaced every day (see stats_salt),
 * so yesterday's keys can never be recomputed and no IP address or user agent is stored.
 */
function stats_visitor(string $ip, string $ua, string $salt): string
{
    return substr(hash_hmac('sha256', $ip . "\n" . $ua, $salt), 0, 16);
}

/** Today's salt; a new random one replaces the old one when the UTC day changes. */
function stats_salt(array $state, int $now): array
{
    $day = gmdate('Y-m-d', $now);
    if (($state['day'] ?? '') === $day && is_string($state['salt'] ?? null) && strlen($state['salt']) === 64) { return $state; }
    return ['day' => $day, 'salt' => bin2hex(random_bytes(32))];
}

/** Add a view's audience data (pure). Keeps only today's visitor keys; series follow the 120-day retention. */
function stats_audience(array $st, string $visitor, string $source, string $device, int $now): array
{
    foreach (['uniqDays', 'srcDays', 'devDays'] as $key) {
        if (!is_array($st[$key] ?? null)) { $st[$key] = []; }
    }
    $day = gmdate('Y-m-d', $now);
    $cut = gmdate('Y-m-d', $now - 120 * 86400);
    $keep = static fn(array $series): array => array_filter($series, static fn($k) => is_string($k) && $k >= $cut, ARRAY_FILTER_USE_KEY);
    if (!is_array($st['seen'] ?? null) || ($st['seen']['day'] ?? '') !== $day || !is_array($st['seen']['keys'] ?? null)) {
        $st['seen'] = ['day' => $day, 'keys' => []];
    }
    if ($visitor !== '' && !isset($st['seen']['keys'][$visitor]) && count($st['seen']['keys']) < 50000) {
        $st['seen']['keys'][$visitor] = 1;
        $st['uniqDays'][$day] = (int) ($st['uniqDays'][$day] ?? 0) + 1;
    }
    $source = in_array($source, STATS_SOURCES, true) ? $source : 'other';
    $device = in_array($device, ['mobile', 'tablet', 'desktop'], true) ? $device : 'desktop';
    foreach (['srcDays' => $source, 'devDays' => $device] as $key => $bucket) {
        if (!is_array($st[$key][$day] ?? null)) { $st[$key][$day] = []; }
        $st[$key][$day][$bucket] = (int) ($st[$key][$day][$bucket] ?? 0) + 1;
    }
    foreach (['uniqDays', 'srcDays', 'devDays'] as $key) { $st[$key] = $keep($st[$key]); }
    return $st;
}

/** Last $n days of unique visitors and per-day source/device counts, oldest first, for the editor. */
function stats_audience_window(array $st, int $now, int $n = 30): array
{
    $uniq = [];
    $src = [];
    $dev = [];
    for ($i = $n - 1; $i >= 0; $i--) {
        $day = gmdate('Y-m-d', $now - $i * 86400);
        $uniq[] = (int) ($st['uniqDays'][$day] ?? 0);
        $row = static fn(string $key): object => (object) (is_array($st[$key][$day] ?? null) ? array_map('intval', $st[$key][$day]) : []);
        $src[] = $row('srcDays');
        $dev[] = $row('devDays');
    }
    $tracked = is_array($st['uniqDays'] ?? null) && $st['uniqDays'] !== [];
    return ['uniqDays' => $tracked ? $uniq : null, 'srcDays' => $tracked ? $src : null, 'devDays' => $tracked ? $dev : null];
}
