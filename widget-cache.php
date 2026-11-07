<?php
declare(strict_types=1);
require_once __DIR__ . '/widget-config.php';

/** Fixed endpoints only; callers cannot supply URLs, seasons or arbitrary cache keys. */
function widget_resources(): array
{
    $resources = [
        'f1-calendar' => ['provider' => 'jolpica', 'ttl' => 3600, 'url' => 'https://api.jolpi.ca/ergast/f1/current.json?limit=100'],
        'f1-standings' => ['provider' => 'jolpica', 'ttl' => 3600, 'url' => 'https://api.jolpi.ca/ergast/f1/current/driverStandings.json?limit=100'],
    ];
    foreach (['gospel', 'classical', 'jazz'] as $genre) {
        $resources['radio-' . $genre] = ['provider' => 'radio', 'ttl' => 86400, 'url' => 'https://de1.api.radio-browser.info/json/stations/search?tag=' . $genre . '&hidebroken=true&is_https=true&codec=MP3&order=votes&reverse=true&limit=12'];
    }
    foreach (widget_settings()['teams'] as $slug => $team) {
        $resources['football-' . $slug] = ['provider' => 'football', 'ttl' => 21600, 'url' => 'https://api.football-data.org/v4/teams/' . $team['id'] . '/matches?dateFrom=' . gmdate('Y-m-d', time() - 120 * 86400) . '&dateTo=' . gmdate('Y-m-d', time() + 120 * 86400) . '&limit=100'];
    }
    return $resources;
}

function widget_https(string $url): string
{
    $parts = parse_url($url);
    return is_array($parts) && ($parts['scheme'] ?? '') === 'https' && !empty($parts['host']) && !isset($parts['user']) ? $url : '';
}

function widget_normalize(string $resource, array $raw): array
{
    if (str_starts_with($resource, 'football-')) {
        if (!isset($raw['matches']) || !is_array($raw['matches'])) { throw new RuntimeException('Invalid match list.'); }
        $items = [];
        foreach ($raw['matches'] as $match) {
            $competition = (string) ($match['competition']['code'] ?? '');
            // Free-tier competitions only. Never imply all fixtures are covered.
            if (!in_array($competition, ['FL1', 'CL', 'WC', 'EC', 'PL', 'PD', 'BL1', 'SA', 'DED', 'PPL', 'ELC', 'BSA'], true)) { continue; }
            $score = $match['score']['fullTime'] ?? [];
            $items[] = ['date' => (string) ($match['utcDate'] ?? ''), 'status' => (string) ($match['status'] ?? ''), 'home' => (string) ($match['homeTeam']['name'] ?? ''), 'away' => (string) ($match['awayTeam']['name'] ?? ''), 'competition' => (string) ($match['competition']['name'] ?? ''), 'homeScore' => isset($score['home']) ? (int) $score['home'] : null, 'awayScore' => isset($score['away']) ? (int) $score['away'] : null];
        }
        usort($items, fn($a, $b) => strcmp($a['date'], $b['date']));
        return ['items' => $items, 'source' => 'football-data.org', 'delayed' => true, 'coverage' => 'Compétitions couvertes par le forfait gratuit uniquement.'];
    }
    if (str_starts_with($resource, 'radio-')) {
        if (!array_is_list($raw)) { throw new RuntimeException('Invalid station list.'); }
        $items = [];
        foreach (array_slice($raw, 0, 12) as $station) {
            $url = widget_https((string) ($station['url_resolved'] ?? ''));
            if (!$url || (int) ($station['hls'] ?? 0) !== 0 || (int) ($station['lastcheckok'] ?? 0) !== 1) { continue; }
            $items[] = ['name' => (string) ($station['name'] ?? 'Radio'), 'url' => $url, 'country' => (string) ($station['countrycode'] ?? ''), 'codec' => (string) ($station['codec'] ?? ''), 'bitrate' => (int) ($station['bitrate'] ?? 0)];
        }
        return ['items' => $items, 'source' => 'Radio Browser'];
    }
    $mr = $raw['MRData'] ?? null;
    if (!is_array($mr)) { throw new RuntimeException('Unexpected sports response.'); }
    $items = [];
    if ($resource === 'f1-calendar') {
        $table = $mr['RaceTable'] ?? [];
        if (!isset($table['Races']) || !is_array($table['Races'])) { throw new RuntimeException('Invalid calendar.'); }
        foreach ($table['Races'] as $race) {
            $items[] = ['name' => (string) ($race['raceName'] ?? ''), 'round' => (string) ($race['round'] ?? ''), 'date' => (string) ($race['date'] ?? ''), 'time' => (string) ($race['time'] ?? ''), 'circuit' => (string) ($race['Circuit']['circuitName'] ?? '')];
        }
    } else {
        $table = $mr['StandingsTable'] ?? [];
        if (!isset($table['StandingsLists']) || !is_array($table['StandingsLists'])) { throw new RuntimeException('Invalid standings.'); }
        foreach (($table['StandingsLists'][0]['DriverStandings'] ?? []) as $driver) {
            $items[] = ['name' => trim(($driver['Driver']['givenName'] ?? '') . ' ' . ($driver['Driver']['familyName'] ?? '')), 'position' => (string) ($driver['position'] ?? ''), 'points' => (string) ($driver['points'] ?? ''), 'wins' => (string) ($driver['wins'] ?? ''), 'team' => (string) ($driver['Constructors'][0]['name'] ?? '')];
        }
    }
    return ['items' => $items, 'season' => (string) ($table['season'] ?? ''), 'source' => 'Jolpica F1'];
}

/** Fail closed: a request is reserved on disk BEFORE any network activity, even on errors. */
function widget_reserve(array $state, string $provider, int $now): array
{
    $budget = $provider === 'radio' ? 6 : 24;
    $day = gmdate('Y-m-d', $now);
    $usage = $state[$provider] ?? [];
    if (($usage['day'] ?? '') !== $day) { $usage = ['day' => $day, 'count' => 0, 'next' => $usage['next'] ?? 0]; }
    $wait = max(0, (int) ($usage['next'] ?? 0) - $now);
    if ($wait || (int) ($usage['count'] ?? 0) >= $budget) {
        return ['allowed' => false, 'state' => $state, 'retryAfter' => max($wait, (int) ($usage['count'] ?? 0) >= $budget ? strtotime($day . ' +1 day UTC') - $now : 1)];
    }
    $usage['count'] = (int) ($usage['count'] ?? 0) + 1;
    $usage['next'] = $now + ($provider === 'football' ? 7 : 2);
    $state[$provider] = $usage;
    return ['allowed' => true, 'state' => $state, 'retryAfter' => 0];
}

function widget_request(string $url): array
{
    if (!function_exists('curl_init')) { throw new RuntimeException('cURL extension required.'); }
    $ch = curl_init($url);
    $body = ''; $retryAfter = 86400;
    curl_setopt($ch, CURLOPT_HEADERFUNCTION, static function ($handle, string $header) use (&$retryAfter): int {
        if (stripos($header, 'Retry-After:') === 0) {
            $value = trim(substr($header, 12));
            $retryAfter = max(86400, ctype_digit($value) ? (int) $value : ((strtotime($value) ?: time() + 86400) - time()));
        }
        return strlen($header);
    });
    $headers = ['Accept: application/json'];
    if (parse_url($url, PHP_URL_HOST) === 'api.football-data.org') {
        $token = widget_settings()['football_token'];
        if ($token === '') { curl_close($ch); throw new RuntimeException('not_configured'); }
        $headers[] = 'X-Auth-Token: ' . $token;
    }
    curl_setopt_array($ch, [CURLOPT_FOLLOWLOCATION => false, CURLOPT_CONNECTTIMEOUT => 3, CURLOPT_TIMEOUT => 7, CURLOPT_PROTOCOLS => CURLPROTO_HTTPS, CURLOPT_USERAGENT => 'TilesPortfolio/1.0 (+https://github.com/fringles-git/tiles)', CURLOPT_HTTPHEADER => $headers, CURLOPT_WRITEFUNCTION => static function ($handle, string $chunk) use (&$body): int { if (strlen($body) + strlen($chunk) > 1048576) { return 0; } $body .= $chunk; return strlen($chunk); }]);
    $ok = curl_exec($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    curl_close($ch);
    if ($code === 429) { throw new RuntimeException('throttled', $retryAfter); }
    if ($ok === false || $code !== 200) { throw new RuntimeException('upstream'); }
    $decoded = json_decode($body, true, 64, JSON_THROW_ON_ERROR);
    if (!is_array($decoded)) { throw new RuntimeException('Invalid response.'); }
    return $decoded;
}

function widget_cached(string $resource, string $directory, ?callable $fetch = null, ?int $clock = null): array
{
    $config = widget_resources()[$resource] ?? null;
    if (!$config) { return ['ok' => false, 'status' => 400, 'retryAfter' => 3600]; }
    if ($config['provider'] === 'football' && widget_settings()['football_token'] === '' && $fetch === null) {
        return ['ok' => false, 'status' => 503, 'retryAfter' => 3600, 'reason' => 'not_configured'];
    }
    $now = $clock ?? time();
    if (!is_dir($directory) && !@mkdir($directory, 0755, true) && !is_dir($directory)) { return ['ok' => false, 'status' => 503, 'retryAfter' => 3600]; }
    $lock = @fopen($directory . '/gateway.lock', 'c');
    if (!$lock || !flock($lock, LOCK_EX)) { if ($lock) { fclose($lock); } return ['ok' => false, 'status' => 503, 'retryAfter' => 60]; }
    try {
        $cacheFile = $directory . '/' . $resource . '.json';
        $cache = is_file($cacheFile) ? json_decode((string) file_get_contents($cacheFile), true) : null;
        if (is_array($cache) && $now - (int) ($cache['at'] ?? 0) < $config['ttl']) { return $cache['data'] + ['ok' => true, 'stale' => false]; }
        $usageFile = $directory . '/usage.json';
        $usage = is_file($usageFile) ? json_decode((string) file_get_contents($usageFile), true) : [];
        if (!is_array($usage)) { return ['ok' => false, 'status' => 503, 'retryAfter' => 3600]; }
        $reservation = widget_reserve($usage, $config['provider'], $now);
        $fallback = is_array($cache) && $now - (int) ($cache['at'] ?? 0) < 7 * 86400 ? $cache['data'] + ['ok' => true, 'stale' => true] : ['ok' => false, 'status' => 503, 'retryAfter' => $reservation['retryAfter'] ?: 300];
        if (!$reservation['allowed'] || getenv('TILES_WIDGETS_OFF') === '1') { return $fallback; }
        if (file_put_contents($usageFile, json_encode($reservation['state']), LOCK_EX) === false) { return $fallback; }
        try {
            $raw = ($fetch ?? 'widget_request')($config['url']);
            $data = widget_normalize($resource, $raw) + ['updatedAt' => gmdate('c', $now)];
            $json = json_encode(['at' => $now, 'data' => $data], JSON_THROW_ON_ERROR);
            $tmp = $cacheFile . '.tmp';
            if (file_put_contents($tmp, $json) === false || !rename($tmp, $cacheFile)) { return $fallback; }
            return $data + ['ok' => true, 'stale' => false];
        } catch (Throwable $e) {
            // No retry loop. A shared cooldown applies to all resources of the provider.
            $usage = $reservation['state'];
            $usage[$config['provider']]['next'] = $now + ($e->getMessage() === 'throttled' ? max(86400, $e->getCode()) : 900);
            file_put_contents($usageFile, json_encode($usage), LOCK_EX);
            return is_array($cache) && $now - (int) ($cache['at'] ?? 0) < 7 * 86400 ? $cache['data'] + ['ok' => true, 'stale' => true] : ['ok' => false, 'status' => 503, 'retryAfter' => $usage[$config['provider']]['next'] - $now];
        }
    } finally { flock($lock, LOCK_UN); fclose($lock); }
}
