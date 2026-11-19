<?php
declare(strict_types=1);
require dirname(__DIR__, 2) . '/src/lib.php';
require dirname(__DIR__, 2) . '/src/seo.php';
function check(bool $condition, string $message): void { if (!$condition) { throw new RuntimeException($message); } echo "PASS: $message\n"; }
$now = strtotime('2026-11-19 12:00:00 UTC');
putenv('TILES_SITE_URL');
check(seo_base_url(['HTTP_HOST' => 'Example.TEST', 'HTTPS' => 'on']) === 'https://example.test/', 'host header normalised');
check(seo_base_url(['HTTP_HOST' => 'evil.test/"><script>']) === 'http://localhost/', 'unsafe Host header never reflected');
check(seo_base_url(['HTTP_HOST' => 'a.test', 'HTTP_X_FORWARDED_PROTO' => 'https']) === 'https://a.test/', 'forwarded HTTPS honoured behind a proxy');
putenv('TILES_SITE_URL=https://brandonlazarre.fr/');
check(seo_base_url(['HTTP_HOST' => 'tiles.other.test']) === 'https://brandonlazarre.fr/', 'configured canonical origin wins over Host');
putenv('TILES_SITE_URL=http://insecure.test'); check(seo_base_url(['HTTP_HOST' => 'a.test']) === 'http://a.test/', 'non-https site_url ignored');
putenv('TILES_SITE_URL=https://x.test/path'); check(seo_base_url(['HTTP_HOST' => 'a.test']) === 'http://a.test/', 'site_url with a path ignored');
putenv('TILES_SITE_URL');
$base = 'https://brandonlazarre.fr/';
$page = ['profile' => ['name' => 'Brandon </script><b>', 'role' => 'Dev', 'bio' => 'Bio', 'avatar' => 'uploads/me.jpg'], 'tiles' => [
    ['id' => 's1', 'type' => 'social', 'data' => ['title' => 'GitHub', 'url' => 'https://github.com/fringles-git']],
    ['id' => 's2', 'type' => 'social', 'data' => ['url' => 'javascript:alert(1)']],
    ['id' => 's3', 'type' => 'social', 'hidden' => true, 'data' => ['url' => 'https://hidden.test/']],
    ['id' => 'h', 'type' => 'section', 'data' => ['title' => 'Projets']],
    ['id' => 'p', 'type' => 'project', 'data' => ['title' => 'EventFlow', 'role' => 'SaaS', 'desc' => 'Gestion <i>événements</i>', 'image' => 'uploads/x.jpg', 'url' => 'https://example.test/ef', 'color' => '#fff']],
    ['id' => 'f', 'type' => 'link', 'start' => '2099-01-01', 'data' => ['title' => 'Futur', 'url' => 'https://future.test/']],
]];
$ld = seo_jsonld($page, $base, $now);
check(substr_count($ld, '</script>') === 1, 'JSON-LD cannot break out of its script tag');
$json = json_decode(substr($ld, strlen('<script type="application/ld+json">'), -strlen('</script>')), true);
check($json['@graph'][0]['@type'] === 'Person' && $json['@graph'][0]['sameAs'] === ['https://github.com/fringles-git'], 'JSON-LD Person with only live https profiles');
check($json['@graph'][0]['image'] === $base . 'uploads/me.jpg', 'JSON-LD image is an absolute uploads URL');
$xml = simplexml_load_string(seo_sitemap($base, $now));
check($xml !== false && (string) $xml->url->loc === $base && (string) $xml->url->lastmod === '2026-11-19', 'sitemap is valid XML with loc and lastmod');
$robots = seo_robots($base);
check(str_contains($robots, "Sitemap: {$base}sitemap.xml") && str_contains($robots, 'Disallow: /admin.php') && substr_count($robots, 'Disallow: /admin.php') === 2, 'robots lists sitemap and keeps admin private in every group');
check(str_contains($robots, 'User-agent: GPTBot') && str_contains($robots, 'User-agent: ClaudeBot'), 'AI crawlers explicitly allowed');
$body = seo_body($page, $now);
check(str_contains($body, '<h2>Projets</h2>') && str_contains($body, 'EventFlow') && str_contains($body, 'Gestion &lt;i&gt;événements&lt;/i&gt;'), 'body text escaped and complete');
check(!str_contains($body, 'Futur') && !str_contains($body, 'uploads/x.jpg') && !str_contains($body, '#fff'), 'scheduled tiles, images and colours excluded');
$llms = seo_llms($page, $base, $now);
check(str_starts_with($llms, "# Brandon </script><b>\n") && str_contains($llms, '[EventFlow](https://example.test/ef)') && !str_contains($llms, 'future.test'), 'llms.txt lists live linked tiles only');
require_once dirname(__DIR__, 2) . '/src/sections.php';
$xml2 = simplexml_load_string(seo_sitemap('https://x.fr/', null, array_keys(TILES_SECTIONS)));
check($xml2 !== false && count($xml2->url) === 5 && (string) $xml2->url[2]->loc === 'https://x.fr/parcours', 'sitemap lists the home page and the four sections');
check(count(simplexml_load_string(seo_sitemap('https://x.fr/', null, ['ok', '../x', 'a b']))->url) === 2, 'sitemap drops malformed slugs');
check(section_by_slug('parcours')['key'] === 'pro' && section_by_slug('pro') === null && section_by_slug(['x']) === null, 'sections resolve by public slug only');
