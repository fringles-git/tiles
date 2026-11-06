<?php
declare(strict_types=1);
ini_set('display_errors', '0');
error_reporting(E_ALL);
require __DIR__ . '/widget-cache.php';
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') { http_response_code(405); header('Allow: GET'); echo '{"ok":false}'; exit; }
$resource = $_GET['resource'] ?? '';
if (!is_string($resource)) { http_response_code(400); echo '{"ok":false}'; exit; }
$result = widget_cached($resource, __DIR__ . '/data/widget-cache');
http_response_code((int) ($result['status'] ?? 200));
if (isset($result['retryAfter'])) { header('Retry-After: ' . (int) $result['retryAfter']); }
unset($result['status']);
echo json_encode($result, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
