<?php
declare(strict_types=1);

// Loaded by paths.php, so every entry point (pages, api, widgets, go, media, seo) shares it.
ini_set('display_errors', '0');
error_reporting(E_ALL);
// Errors go to a private, size-capped log under data/ (never served: data/.htaccess denies all).
ini_set('log_errors', '1');
ini_set('error_log', tiles_log_file());
set_exception_handler('tiles_fail');

/** Private log path; rotated to .1 past 1 MB so a noisy error cannot fill the disk. */
function tiles_log_file(): string
{
    $dir = DATA_DIR . '/logs';
    if (!is_dir($dir)) { @mkdir($dir, 0750, true); }
    $file = $dir . '/php-error.log';
    if (@filesize($file) > 1024 * 1024) { @rename($file, $file . '.1'); }
    return $file;
}

/** One line in the private log: what failed and where, never request bodies or secrets. */
function tiles_log(string $message, array $context = []): void
{
    $extra = $context ? ' ' . json_encode($context, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PARTIAL_OUTPUT_ON_ERROR) : '';
    error_log('[tiles] ' . str_replace(["\r", "\n"], ' ', $message) . $extra);
}

/** Uncaught exception: log it, answer a generic 500 (JSON for the API, text elsewhere). */
function tiles_fail(Throwable $e): void
{
    tiles_log(get_class($e) . ': ' . $e->getMessage(), ['at' => basename($e->getFile()) . ':' . $e->getLine(),
        'uri' => substr((string) ($_SERVER['REQUEST_URI'] ?? ''), 0, 200)]);
    if (PHP_SAPI === 'cli') { fwrite(STDERR, $e->getMessage() . PHP_EOL); exit(1); }
    if (!headers_sent()) {
        http_response_code(500);
        $json = preg_match('/(?:api|widgets)\.php\z/', (string) ($_SERVER['SCRIPT_NAME'] ?? ''));
        header('Content-Type: ' . ($json ? 'application/json' : 'text/plain') . '; charset=utf-8');
        header('Cache-Control: no-store');
        echo $json ? '{"error":"Server error. Try again in a moment."}' : 'Server error. Try again in a moment.';
    }
}
