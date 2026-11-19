<?php
declare(strict_types=1);

/**
 * Parse an absolute http(s) URL with the WHATWG URL standard (PHP 8.5 URI extension), the same
 * algorithm browsers use, so the URL we validate is the URL the visitor's browser will follow.
 * parse_url() is not standards-compliant and can disagree with browsers on hosts and user info.
 * Rejects credentials, missing hosts, control characters and URLs over 2048 bytes.
 */
function url_parse(string $url, bool $httpsOnly = false): ?Uri\WhatWg\Url
{
    $url = trim($url);
    if ($url === '' || strlen($url) > 2048 || preg_match('/[\x00-\x1f\x7f\s]/', $url)) { return null; }
    $errors = [];
    $u = Uri\WhatWg\Url::parse($url, null, $errors);
    if ($u === null) { return null; }
    $scheme = $u->getScheme();
    if (!in_array($scheme, $httpsOnly ? ['https'] : ['http', 'https'], true)) { return null; }
    if (($u->getAsciiHost() ?? '') === '' || ($u->getUsername() ?? '') !== '' || ($u->getPassword() ?? '') !== '') { return null; }
    return $u;
}

/** Normalised URL string, or '' when invalid. */
function url_safe(string $url, bool $httpsOnly = false): string
{
    return url_parse($url, $httpsOnly)?->toAsciiString() ?? '';
}

/** Lower-cased ASCII host of a valid URL, or ''. */
function url_host(string $url): string
{
    return strtolower(url_parse($url)?->getAsciiHost() ?? '');
}
