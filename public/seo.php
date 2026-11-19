<?php
declare(strict_types=1);
require dirname(__DIR__) . '/src/lib.php';
require dirname(__DIR__) . '/src/seo.php';
require dirname(__DIR__) . '/src/sections.php';

$file = (string) ($_GET['f'] ?? '');
$base = seo_base_url();
$now = time();
$pagePath = DATA_DIR . '/page.json';
$page = read_json('page.json', []);

switch ($file) {
    case 'robots.txt':
        $type = 'text/plain'; $body = seo_robots($base); break;
    case 'sitemap.xml':
        $type = 'application/xml'; $body = seo_sitemap($base, is_file($pagePath) ? (int) filemtime($pagePath) : null, array_keys(TILES_SECTIONS)); break;
    case 'llms.txt':
        $type = 'text/plain'; $body = seo_llms($page, $base, $now); break;
    default:
        http_response_code(404); header('Content-Type: text/plain; charset=utf-8'); echo 'Not found'; exit;
}
header('Content-Type: ' . $type . '; charset=utf-8');
header('Cache-Control: public, max-age=3600');
header('X-Content-Type-Options: nosniff');
echo $body;
