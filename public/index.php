<?php
declare(strict_types=1);
require dirname(__DIR__) . '/src/lib.php';
require dirname(__DIR__) . '/src/seo.php';
require dirname(__DIR__) . '/src/sections.php';
require dirname(__DIR__) . '/src/journal.php';
redirect_public_to_site();

$page = public_page();
if (!$page) {
    http_response_code(503);
    echo 'This page is being set up.';
    exit;
}

$page['journal'] = array_values(array_filter($page['journal'] ?? [], static fn($entry) => is_array($entry) && !empty($entry['published'])));
// Hidden and out-of-schedule tiles never leave the server: the public boot data is readable in the page source.
$page['tiles'] = array_values(array_filter($page['tiles'] ?? [], static fn($tile) => is_array($tile) && seo_tile_live($tile, time())));

$profile = $page['profile'] ?? [];
$name = (string) ($profile['name'] ?? 'Tiles');
$role = (string) ($profile['role'] ?? '');
$bio = (string) ($profile['bio'] ?? '');
$title = $role !== '' ? "$name · $role" : $name;
$universes = tiles_universes($page);
$universeKeys = array_column($universes, 'key');
$wantedSection = $_GET['section'] ?? null;
$section = section_by_slug($wantedSection, $page);
// Any short slug reaches this page (custom universes); an unknown one is a real 404, not the home page.
if ($wantedSection !== null && !$section) { http_response_code(404); }
$description = $bio;
if ($section) {
    $title = $section['label'] . ' · ' . $name;
    $description = $section['question'];
}
$wanted = $_GET['article'] ?? null;
$article = $wanted === null ? null : journal_find($page, $wanted);
if ($wanted !== null && !$article) { http_response_code(404); }
if ($article) {
    $title = $article['title'] . ' · ' . $name;
    $excerpt = trim((string) ($article['excerpt'] ?? ''));
    $description = $excerpt !== '' ? $excerpt : (string) preg_replace('/^(.{0,157}\S*).*$/su', '$1…', trim((string) preg_replace('/[#*>`\s]+/u', ' ', (string) $article['content'])));
}

$base = seo_base_url();
$url = $base . ($article ? 'journal-' . $article['slug'] : ($section['slug'] ?? ''));
$now = time();
$head = '<meta name="robots" content="' . (($wanted !== null && !$article) || ($wantedSection !== null && !$section) ? 'noindex' : 'index, follow, max-image-preview:large') . '">'
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

if ($article) {
    $head = str_replace('<meta property="og:type" content="profile">', '<meta property="og:type" content="article"><meta property="article:published_time" content="' . e((string) $article['date']) . '">', $head);
    $head .= '<script type="application/ld+json">' . json_encode(['@context' => 'https://schema.org', '@type' => 'BlogPosting', 'headline' => (string) $article['title'], 'description' => $description, 'datePublished' => (string) $article['date'], 'url' => $url, 'mainEntityOfPage' => $url, 'author' => ['@type' => 'Person', 'name' => $name, 'url' => $base]], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP) . '</script>';
}
// Plain-HTML fallback for visitors and crawlers that do not run JavaScript.
$items = seo_body($section ? ['tiles' => section_tiles($page['tiles'], $section['key'], $universeKeys)] + $page : $page, $now);
$noscript = '<noscript><main class="noscript-page">'
    . ($article
        ? '<article><h1>' . e((string) $article['title']) . '</h1><p><time datetime="' . e((string) $article['date']) . '">' . e((string) $article['date']) . '</time> · ' . e($name) . '</p>' . journal_markdown((string) $article['content']) . '</article>'
        : ($section
        ? '<h1>' . e($section['label']) . ' · ' . e($name) . '</h1><p>' . e($section['question']) . '</p>'
        : '<h1>' . e($name) . '</h1><p>' . e($role) . '</p><p>' . e($bio) . '</p>'))
    . ($article ? '' : $items)
    . '<nav><a href="' . e($base) . '">' . e($name) . '</a>' . implode('', array_map(static fn(array $u): string => ' · <a href="' . e($base . $u['slug']) . '">' . e($u['label']) . '</a>', $universes)) . '</nav></main></noscript>';

$head .= seo_jsonld($page, $base, $now);
header('Cache-Control: public, max-age=60');
render_shell($title, $description, ['mode' => 'public', 'page' => $page, 'article' => $article['id'] ?? null], $head, $noscript);
