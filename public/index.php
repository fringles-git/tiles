<?php
declare(strict_types=1);
require dirname(__DIR__) . '/src/lib.php';
require dirname(__DIR__) . '/src/seo.php';
require dirname(__DIR__) . '/src/sections.php';

$page = read_json('page.json', null);
if (!$page) {
    http_response_code(503);
    echo 'This page is being set up.';
    exit;
}

$page['journal'] = array_values(array_filter($page['journal'] ?? [], static fn($entry) => is_array($entry) && !empty($entry['published'])));

$profile = $page['profile'] ?? [];
$name = (string) ($profile['name'] ?? 'Tiles');
$role = (string) ($profile['role'] ?? '');
$bio = (string) ($profile['bio'] ?? '');
$title = $role !== '' ? "$name · $role" : $name;
$section = section_by_slug($_GET['section'] ?? null);
$description = $bio;
if ($section) {
    $title = $section['label'] . ' · ' . $name;
    $description = $section['question'];
}

$base = seo_base_url();
$url = $base . ($section['slug'] ?? '');
$now = time();
$head = '<meta name="robots" content="index, follow, max-image-preview:large">'
    . '<meta name="author" content="' . e($name) . '">'
    . '<meta property="og:locale" content="fr_FR">'
    . '<meta property="og:site_name" content="' . e($name) . '">'
    . '<meta property="og:type" content="profile">'
    . '<meta property="og:title" content="' . e($title) . '">'
    . '<meta property="og:description" content="' . e($description) . '">'
    . '<meta property="og:url" content="' . e($url) . '">'
    . '<link rel="canonical" href="' . e($url) . '">'
    . '<meta name="twitter:card" content="summary_large_image">';
$avatar = (string) ($profile['avatar'] ?? '');
$hasAvatar = preg_match('#^uploads/[A-Za-z0-9_-]+\.(jpe?g|png|webp|gif)$#', $avatar) === 1 && is_file(UPLOAD_DIR . '/' . basename($avatar));
$shareImage = $base . ($hasAvatar ? $avatar : 'assets/images/share.png');
$head .= '<meta property="og:image" content="' . e($shareImage) . '">'
    . '<meta property="og:image:alt" content="' . e($name . ' · Portfolio') . '">'
    . '<meta name="twitter:title" content="' . e($title) . '">'
    . '<meta name="twitter:description" content="' . e($description) . '">'
    . '<meta name="twitter:image" content="' . e($shareImage) . '">';
if (!$hasAvatar) {
    $head .= '<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">';
}

// Plain-HTML fallback for visitors and crawlers that do not run JavaScript.
$items = seo_body($section ? ['tiles' => section_tiles($page['tiles'] ?? [], $section['key'])] + $page : $page, $now);
$noscript = '<noscript><main style="max-width:640px;margin:40px auto;padding:0 16px;font-family:sans-serif">'
    . ($section
        ? '<h1>' . e($section['label']) . ' · ' . e($name) . '</h1><p>' . e($section['question']) . '</p>'
        : '<h1>' . e($name) . '</h1><p>' . e($role) . '</p><p>' . e($bio) . '</p>')
    . $items
    . '<nav><a href="' . e($base) . '">' . e($name) . '</a>' . implode('', array_map(static fn(string $slug, array $s): string => ' · <a href="' . e($base . $slug) . '">' . e($s['label']) . '</a>', array_keys(TILES_SECTIONS), TILES_SECTIONS)) . '</nav></main></noscript>';

$head .= seo_jsonld($page, $base, $now);
header('Cache-Control: public, max-age=60');
render_shell($title, $description, ['mode' => 'public', 'page' => $page], $head, $noscript);
