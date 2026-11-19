<?php
declare(strict_types=1);
require dirname(__DIR__, 2) . '/src/url.php';
function check(bool $condition, string $message): void { if (!$condition) { throw new RuntimeException($message); } echo "PASS: $message\n"; }
// The classic parse_url confusion: browsers treat "\" as "/" in http(s) URLs, so the real host is evil.test.
check(url_host('https://evil.test\\@good.test/') === 'evil.test', 'backslash trick resolves to the host a browser would visit');
check(url_safe('https://user:pass@example.test/') === '' && url_safe('https://user@example.test/') === '', 'credentials are refused');
check(url_safe('javascript:alert(1)') === '' && url_safe('ftp://example.test/') === '' && url_safe('//example.test') === '', 'only absolute http(s) URLs pass');
check(url_safe('http://example.test/', true) === '' && url_safe('https://example.test/', true) === 'https://example.test/', 'https-only mode');
check(url_safe("https://example.test/a b") === '' && url_safe("https://exa\tmple.test/") === '' && url_safe('https://example.test/' . str_repeat('a', 2050)) === '', 'whitespace, control characters and oversized URLs are refused');
check(url_safe('HTTPS://EXAMPLE.test/a?x=1') === 'https://example.test/a?x=1', 'scheme and host are normalised, path and query kept');
check(url_host('https://bücher.example/') === 'xn--bcher-kva.example', 'internationalised hosts become ASCII');
check(url_safe('not a url') === '' && url_safe('') === '', 'garbage is refused');
