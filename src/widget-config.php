<?php
declare(strict_types=1);

require_once __DIR__ . '/paths.php';

/** Private configuration is never included in the browser boot payload. */
function widget_settings(): array
{
    $private = tiles_private_config();
    $token = trim((string) (getenv('FOOTBALL_DATA_TOKEN') ?: ($private['football_token'] ?? '')));
    if (!preg_match('/^[A-Za-z0-9]{16,128}$/', $token)) { $token = ''; }
    $teams = [
        'psg' => ['id' => 524, 'name' => 'Paris Saint-Germain', 'url' => 'https://www.psg.fr/'],
        'france' => ['id' => 773, 'name' => 'France · équipe masculine', 'url' => 'https://www.fff.fr/equipe-nationale/'],
    ];
    foreach (($private['teams'] ?? []) as $slug => $team) {
        if (!is_string($slug) || $slug === 'f1' || !preg_match('/^[a-z][a-z0-9-]{1,23}$/', $slug) || !is_array($team)) { continue; }
        $id = filter_var($team['id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1, 'max_range' => 999999]]);
        if (!$id || !is_string($team['name'] ?? null)) { continue; }
        $url = (string) ($team['url'] ?? '');
        if (!filter_var($url, FILTER_VALIDATE_URL) || !str_starts_with($url, 'https://')) { $url = 'https://www.football-data.org/'; }
        $teams[$slug] = ['id' => $id, 'name' => substr($team['name'], 0, 100), 'url' => $url];
    }
    // Canonical public origin (https only, no path). Falls back to the validated Host header when empty.
    $site = rtrim(trim((string) (getenv('TILES_SITE_URL') ?: ($private['site_url'] ?? ''))), '/');
    $parts = $site === '' ? false : parse_url($site);
    if (!is_array($parts) || ($parts['scheme'] ?? '') !== 'https' || empty($parts['host']) || isset($parts['user']) || isset($parts['path']) || isset($parts['query'])
        || !preg_match('/^[a-z0-9.-]{1,253}$/i', $parts['host'])) { $site = ''; }
    else { $site = 'https://' . strtolower($parts['host']) . (isset($parts['port']) ? ':' . (int) $parts['port'] : ''); }
    return ['football_token' => $token, 'teams' => $teams, 'site_url' => $site];
}

function widget_catalogue(): array
{
    $items = [['key' => 'f1', 'name' => 'Formule 1', 'url' => 'https://www.formula1.com/']];
    foreach (widget_settings()['teams'] as $key => $team) {
        $items[] = ['key' => $key, 'name' => $team['name'], 'url' => $team['url']];
    }
    return $items;
}
