<?php
declare(strict_types=1);
require_once __DIR__ . '/widget-config.php';

/** Canonical origin: configured site_url, else a syntactically valid Host header (never reflected unchecked). */
function seo_base_url(?array $server = null): string
{
    $server ??= $_SERVER;
    $configured = widget_settings()['site_url'];
    if ($configured !== '') { return $configured . '/'; }
    $host = strtolower((string) ($server['HTTP_HOST'] ?? ''));
    if (!preg_match('/^[a-z0-9.-]{1,253}(:\d{1,5})?$/', $host)) { $host = 'localhost'; }
    $https = !empty($server['HTTPS']) && $server['HTTPS'] !== 'off';
    return ($https ? 'https://' : 'http://') . $host . '/';
}

/** Hidden or out-of-schedule tiles are neither indexed nor listed (UTC day boundaries). */
function seo_tile_live(array $tile, int $now): bool
{
    if (!empty($tile['hidden'])) { return false; }
    foreach (['start' => 'T00:00:00Z', 'end' => 'T23:59:59Z'] as $key => $time) {
        $day = (string) ($tile[$key] ?? '');
        if ($day === '') { continue; }
        $at = preg_match('/^\d{4}-\d{2}-\d{2}$/', $day) ? strtotime($day . $time) : false;
        if ($at === false || ($key === 'start' ? $at > $now : $at < $now)) { return false; }
    }
    return true;
}

function seo_http_url(string $url): string
{
    $url = trim($url);
    return strlen($url) <= 2048 && preg_match('#^https?://[^\s\x00-\x1f\x7f]+$#i', $url) ? $url : '';
}

function seo_jsonld(array $page, string $base, int $now): string
{
    $profile = $page['profile'] ?? [];
    $same = [];
    foreach (($page['tiles'] ?? []) as $tile) {
        if (is_array($tile) && ($tile['type'] ?? '') === 'social' && seo_tile_live($tile, $now)) {
            $url = seo_http_url((string) (($tile['data'] ?? [])['url'] ?? ''));
            if ($url !== '' && str_starts_with($url, 'https://')) { $same[$url] = true; }
        }
    }
    $name = (string) ($profile['name'] ?? '');
    $avatar = (string) ($profile['avatar'] ?? '');
    $person = array_filter([
        '@type' => 'Person', '@id' => $base . '#person', 'name' => $name, 'url' => $base,
        'jobTitle' => (string) ($profile['role'] ?? ''), 'description' => (string) ($profile['bio'] ?? ''),
        'image' => preg_match('#^uploads/[A-Za-z0-9_-]+\.(jpe?g|png|webp|gif)$#', $avatar) ? $base . $avatar : '',
        'sameAs' => array_keys($same),
    ], static fn($v) => $v !== '' && $v !== []);
    $graph = ['@context' => 'https://schema.org', '@graph' => [
        $person,
        array_filter(['@type' => 'WebSite', '@id' => $base . '#website', 'url' => $base, 'name' => $name, 'inLanguage' => 'fr', 'about' => ['@id' => $base . '#person']], static fn($v) => $v !== ''),
    ]];
    return '<script type="application/ld+json">' . json_encode($graph, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . '</script>';
}

function seo_sitemap(string $base, ?int $lastModified): string
{
    $loc = htmlspecialchars($base, ENT_XML1 | ENT_QUOTES, 'UTF-8');
    $mod = $lastModified ? '<lastmod>' . gmdate('Y-m-d', $lastModified) . '</lastmod>' : '';
    return '<?xml version="1.0" encoding="UTF-8"?>' . "\n" . '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>' . $loc . '</loc>' . $mod . '<changefreq>monthly</changefreq><priority>1.0</priority></url></urlset>' . "\n";
}

function seo_robots(string $base): string
{
    $deny = "Disallow: /admin.php\nDisallow: /api.php\nDisallow: /widgets.php\nDisallow: /go/\nDisallow: /data/\nDisallow: /seed/\n";
    $ai = ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-SearchBot', 'PerplexityBot', 'Google-Extended'];
    return "User-agent: *\nAllow: /\n$deny\n"
        . implode("\n", array_map(static fn(string $bot): string => "User-agent: $bot", $ai)) . "\nAllow: /\n$deny\n"
        . "Sitemap: {$base}sitemap.xml\n";
}

/** Plain-text digest for AI assistants (llms.txt convention). */
function seo_llms(array $page, string $base, int $now): string
{
    $p = $page['profile'] ?? [];
    $line = static fn(string $s): string => trim(preg_replace('/\s+/', ' ', $s) ?? '');
    $out = '# ' . $line((string) ($p['name'] ?? 'Tiles')) . "\n";
    $summary = $line(trim((string) ($p['role'] ?? '') . '. ' . (string) ($p['bio'] ?? ''), ' .'));
    if ($summary !== '') { $out .= "\n> $summary\n"; }
    $links = '';
    foreach (($page['tiles'] ?? []) as $tile) {
        if (!is_array($tile) || !seo_tile_live($tile, $now)) { continue; }
        $d = $tile['data'] ?? [];
        $title = $line((string) ($d['title'] ?? $d['name'] ?? ''));
        $url = seo_http_url((string) ($d['url'] ?? ''));
        if ($title === '' || $url === '') { continue; }
        $desc = $line((string) ($d['desc'] ?? ''));
        $links .= '- [' . str_replace(['[', ']'], '', $title) . "]($url)" . ($desc !== '' ? ': ' . $desc : '') . "\n";
    }
    return $out . "\n## Page\n\n- [Accueil]($base)\n" . ($links !== '' ? "\n## Liens\n\n$links" : '');
}

/** Crawler-readable HTML of every live tile (also shown to visitors without JavaScript). */
function seo_body(array $page, int $now): string
{
    $skip = ['url' => 1, 'image' => 1, 'images' => 1, 'color' => 1, 'icon' => 1, 'lat' => 1, 'lon' => 1, 'zoom' => 1, 'follow' => 1, 'view' => 1, 'f1follow' => 1, 'genre' => 1];
    $out = '';
    foreach (($page['tiles'] ?? []) as $tile) {
        if (!is_array($tile) || !seo_tile_live($tile, $now)) { continue; }
        $d = is_array($tile['data'] ?? null) ? $tile['data'] : [];
        $title = trim((string) ($d['title'] ?? $d['name'] ?? $d['caption'] ?? $d['club'] ?? ''));
        if (($tile['type'] ?? '') === 'section') { if ($title !== '') { $out .= '<h2>' . e($title) . '</h2>'; } continue; }
        $parts = [];
        foreach ($d as $key => $value) {
            if (isset($skip[$key]) || !is_string($value) || trim($value) === '' || trim($value) === $title) { continue; }
            if (preg_match('#^(https?://|uploads/|data:)#i', trim($value))) { continue; }
            $parts[] = preg_replace('/^(.{400}).+$/su', '$1…', trim($value));
        }
        if ($title === '' && $parts === []) { continue; }
        $url = seo_http_url((string) ($d['url'] ?? ''));
        $head = $title === '' ? '' : ($url !== '' ? '<a href="' . e($url) . '" rel="noopener">' . e($title) . '</a>' : e($title));
        $out .= '<article>' . ($head !== '' ? '<h3>' . $head . '</h3>' : '') . ($parts ? '<p>' . e(implode(' · ', $parts)) . '</p>' : '') . '</article>';
    }
    return $out;
}
