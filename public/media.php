<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/src/paths.php';

// Keep legacy uploads/<name> URLs while the files themselves stay outside the web root.
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: strict-origin-when-cross-origin');
if (!in_array($_SERVER['REQUEST_METHOD'] ?? '', ['GET', 'HEAD'], true)) {
    header('Allow: GET, HEAD'); http_response_code(405); exit;
}
$name = $_GET['file'] ?? '';
if (!is_string($name) || !preg_match('/\A[A-Za-z0-9_-]+\.(?:jpe?g|png|webp|gif|pdf)\z/i', $name)) {
    http_response_code(404); exit;
}
$root = realpath(UPLOAD_DIR);
$file = $root === false ? false : realpath($root . DIRECTORY_SEPARATOR . $name);
if ($file === false || !str_starts_with($file, $root . DIRECTORY_SEPARATOR) || !is_file($file)) {
    http_response_code(404); exit;
}
$extension = strtolower(pathinfo($name, PATHINFO_EXTENSION));
$allowed = ['jpg'=>'image/jpeg', 'jpeg'=>'image/jpeg', 'png'=>'image/png', 'webp'=>'image/webp', 'gif'=>'image/gif', 'pdf'=>'application/pdf'];
$type = (new finfo(FILEINFO_MIME_TYPE))->file($file);
if ($type !== $allowed[$extension]) { http_response_code(404); exit; }
$etag = '"' . hash_file('sha256', $file) . '"';
header('Content-Type: ' . $type);
header('Content-Disposition: inline; filename="' . $name . '"');
header('Cache-Control: public, max-age=3600');
header('ETag: ' . $etag);
if (trim($_SERVER['HTTP_IF_NONE_MATCH'] ?? '') === $etag) { http_response_code(304); exit; }
header('Content-Length: ' . filesize($file));
if ($_SERVER['REQUEST_METHOD'] !== 'HEAD') { readfile($file); }
