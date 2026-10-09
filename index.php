<?php
declare(strict_types=1);
require __DIR__ . '/lib.php';

$page = read_json('page.json', null);
if (!$page) {
    http_response_code(503);
    echo 'This page is being set up.';
    exit;
}

$profile = $page['profile'] ?? [];
$name = (string) ($profile['name'] ?? 'Tiles');
$role = (string) ($profile['role'] ?? '');
$bio = (string) ($profile['bio'] ?? '');
$title = $role !== '' ? "$name · $role" : $name;

$base = (is_https() ? 'https://' : 'http://') . ($_SERVER['HTTP_HOST'] ?? 'tiles.brandonlazarre.fr') . '/';
$head = '<meta property="og:type" content="profile">'
    . '<meta property="og:title" content="' . e($title) . '">'
    . '<meta property="og:description" content="' . e($bio) . '">'
    . '<meta property="og:url" content="' . e($base) . '">'
    . '<link rel="canonical" href="' . e($base) . '">'
    . '<meta name="twitter:card" content="summary_large_image">';
$avatar = (string) ($profile['avatar'] ?? '');
if (preg_match('#^uploads/[A-Za-z0-9_-]+\.(jpe?g|png|webp|gif)$#', $avatar)) {
    $head .= '<meta property="og:image" content="' . e($base . $avatar) . '">';
}

// Plain-HTML fallback for visitors and crawlers that do not run JavaScript.
$items = '';
foreach (($page['tiles'] ?? []) as $tile) {
    if (!empty($tile['hidden'])) {
        continue;
    }
    $d = $tile['data'] ?? [];
    $label = (string) ($d['title'] ?? $d['name'] ?? $d['caption'] ?? $d['club'] ?? '');
    $url = (string) ($d['url'] ?? '');
    if ($label === '') {
        continue;
    }
    if (($tile['type'] ?? '') === 'section') {
        $items .= '<h2>' . e($label) . '</h2>';
    } elseif (preg_match('#^https?://#i', $url)) {
        $items .= '<p><a href="' . e($url) . '">' . e($label) . '</a></p>';
    } else {
        $items .= '<p>' . e($label) . '</p>';
    }
}
$noscript = '<noscript><main style="max-width:640px;margin:40px auto;padding:0 16px;font-family:sans-serif">'
    . '<h1>' . e($name) . '</h1><p>' . e($role) . '</p><p>' . e($bio) . '</p>' . $items . '</main></noscript>';

header('Cache-Control: public, max-age=60');
render_shell($title, $bio, ['mode' => 'public', 'page' => $page], $head, $noscript);
