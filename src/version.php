<?php
declare(strict_types=1);

/** Commit of the deployed checkout, read from .git without running git (Hostinger Git deployments keep .git). */
function tiles_commit(string $root): string
{
    $env = (string) getenv('TILES_COMMIT');
    if (preg_match('/\A[0-9a-f]{7,40}\z/', $env)) { return substr($env, 0, 12); }
    $head = @file_get_contents("$root/.git/HEAD");
    if (!is_string($head)) { return ''; }
    $head = trim($head);
    if (preg_match('/\A[0-9a-f]{40}\z/', $head)) { return substr($head, 0, 12); }
    if (!preg_match('#\Aref: (refs/heads/[A-Za-z0-9._/-]{1,200})\z#', $head, $m) || str_contains($m[1], '..')) { return ''; }
    $ref = @file_get_contents("$root/.git/" . $m[1]);
    if (is_string($ref) && preg_match('/\A([0-9a-f]{40})/', trim($ref), $h)) { return substr($h[1], 0, 12); }
    $packed = @file_get_contents("$root/.git/packed-refs");
    if (is_string($packed) && preg_match('/^([0-9a-f]{40}) ' . preg_quote($m[1], '/') . '$/m', $packed, $h)) { return substr($h[1], 0, 12); }
    return '';
}

/** Git blob id of each public CSS/JS file: equals `git hash-object <file>`, so a deploy can be checked without .git. */
function tiles_assets(string $public): array
{
    $out = [];
    foreach (glob("$public/assets/{js,css}/*.{js,css}", GLOB_BRACE) ?: [] as $file) {
        $bytes = (string) file_get_contents($file);
        $out[substr($file, strlen($public) + 1)] = substr(sha1('blob ' . strlen($bytes) . "\0" . $bytes), 0, 12);
    }
    ksort($out);
    return $out;
}
