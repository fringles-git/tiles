<?php
declare(strict_types=1);

require_once __DIR__ . '/paths.php';

/** Private configuration is never included in the browser boot payload. */
function widget_settings(): array
{
    $file = getenv('TILES_CONFIG_FILE') ?: (is_file(ROOT_DIR . '/config/config.php')
        ? ROOT_DIR . '/config/config.php' : ROOT_DIR . '/config.local.php');
    $private = [];
    if (is_file($file)) {
        ob_start();
        try { $private = require $file; }
        catch (Throwable $e) { $private = []; }
        finally { ob_end_clean(); }
    }
    if (!is_array($private)) { $private = []; }
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
    return ['football_token' => $token, 'teams' => $teams];
}

function widget_catalogue(): array
{
    $items = [['key' => 'f1', 'name' => 'Formule 1', 'url' => 'https://www.formula1.com/']];
    foreach (widget_settings()['teams'] as $key => $team) {
        $items[] = ['key' => $key, 'name' => $team['name'], 'url' => $team['url']];
    }
    return $items;
}
