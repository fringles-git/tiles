<?php
declare(strict_types=1);
// PHP's dev server ignores .htaccess; reproduce the same public boundary for local QA.
$public = dirname(__DIR__) . '/public';
$path = rawurldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?: '/');
if (preg_match('#\A/uploads/([A-Za-z0-9_-]+\.(?:jpe?g|png|webp|gif|pdf))\z#i', $path, $m)) {
    $_GET['file'] = $m[1]; require $public . '/media.php'; return true;
}
if (in_array($path, ['/', '/index.php', '/admin.php', '/api.php', '/widgets.php', '/media.php', '/robots.txt'], true)) { return false; }
if (str_starts_with($path, '/assets/')) {
    $file = realpath($public . $path);
    if ($file !== false && str_starts_with($file, realpath($public . '/assets') . DIRECTORY_SEPARATOR) && is_file($file)
        && preg_match('/\.(?:css|js|svg|png|jpe?g|gif|webp|woff2?|txt|md)\z/i', $file)) { return false; }
}
http_response_code(404); echo 'Not found'; return true;
