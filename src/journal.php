<?php
declare(strict_types=1);

/** URL slug of a title; identical to hub.js `slug()` (tested for parity). */
function journal_slug(string $title): string
{
    $s = strtr(mb_strtolower($title, 'UTF-8'), ['œ' => 'oe', 'æ' => 'ae', 'ß' => 'ss', '’' => '-', "'" => '-']);
    if (class_exists('Normalizer')) {
        $s = (string) preg_replace('/\p{Mn}+/u', '', (string) Normalizer::normalize($s, Normalizer::FORM_D));
    } else {
        $s = strtr($s, ['à' => 'a', 'â' => 'a', 'ä' => 'a', 'á' => 'a', 'ç' => 'c', 'é' => 'e', 'è' => 'e', 'ê' => 'e', 'ë' => 'e', 'î' => 'i', 'ï' => 'i', 'í' => 'i', 'ô' => 'o', 'ö' => 'o', 'ó' => 'o', 'ù' => 'u', 'û' => 'u', 'ü' => 'u', 'ú' => 'u', 'ÿ' => 'y', 'ñ' => 'n']);
    }
    $s = trim((string) preg_replace('/[^a-z0-9]+/', '-', $s), '-');
    return trim(substr($s, 0, 80), '-');
}

/** Published articles in page order, each with a unique slug (collisions get an id suffix). */
function journal_published(array $page): array
{
    $out = [];
    $used = [];
    foreach ($page['journal'] ?? [] as $entry) {
        if (!is_array($entry) || empty($entry['published']) || trim((string) ($entry['title'] ?? '')) === '' || trim((string) ($entry['content'] ?? '')) === '') { continue; }
        $slug = journal_slug((string) $entry['title']);
        $id = strtolower((string) preg_replace('/[^A-Za-z0-9]/', '', (string) ($entry['id'] ?? '')));
        if ($slug === '' || isset($used[$slug])) { $slug = trim($slug . '-' . substr($id, 0, 6), '-'); }
        for ($base = $slug, $n = 2; $slug === '' || isset($used[$slug]); $n++) { $slug = trim($base . '-' . $n, '-'); }
        $used[$slug] = true;
        $out[] = $entry + ['slug' => $slug];
    }
    return $out;
}

function journal_find(array $page, mixed $slug): ?array
{
    if (!is_string($slug) || !preg_match('/\A[a-z0-9-]{1,100}\z/', $slug)) { return null; }
    foreach (journal_published($page) as $entry) { if ($entry['slug'] === $slug) { return $entry; } }
    return null;
}

/** Same Markdown subset as hub.js `markdown()`: headings, lists, quotes, paragraphs, code, bold, italic. Never raw HTML. */
function journal_markdown(string $text): string
{
    $inline = static fn(string $s): string => (string) preg_replace(['/`([^`]+)`/', '/\*\*([^*]+)\*\*/', '/\*([^*]+)\*/'], ['<code>$1</code>', '<strong>$1</strong>', '<em>$1</em>'], htmlspecialchars($s, ENT_QUOTES, 'UTF-8'));
    $out = [];
    $list = false;
    foreach (explode("\n", $text) as $line) {
        $s = trim($line);
        if (preg_match('/^[-*] /', $s)) { if (!$list) { $out[] = '<ul>'; $list = true; } $out[] = '<li>' . $inline(substr($s, 2)) . '</li>'; continue; }
        if ($list) { $out[] = '</ul>'; $list = false; }
        if (preg_match('/^(#{1,3}) (.*)$/', $s, $m)) { $n = strlen($m[1]) + 1; $out[] = "<h$n>" . $inline($m[2]) . "</h$n>"; }
        elseif (str_starts_with($s, '> ')) { $out[] = '<blockquote>' . $inline(substr($s, 2)) . '</blockquote>'; }
        elseif ($s !== '') { $out[] = '<p>' . $inline($s) . '</p>'; }
    }
    if ($list) { $out[] = '</ul>'; }
    return implode('', $out);
}
