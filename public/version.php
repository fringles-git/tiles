<?php
declare(strict_types=1);
require dirname(__DIR__) . '/src/paths.php';
require dirname(__DIR__) . '/src/version.php';

// Deployment check: which commit and which asset versions this server actually serves. No secrets, no cache.
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
header('X-Robots-Tag: noindex');
echo json_encode(['commit' => tiles_commit(ROOT_DIR) ?: null, 'php' => PHP_MAJOR_VERSION . '.' . PHP_MINOR_VERSION, 'assets' => tiles_assets(PUBLIC_DIR)], JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT) . "\n";
