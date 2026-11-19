<?php
declare(strict_types=1);
require dirname(__DIR__, 2) . '/src/journal.php';
function check(bool $condition, string $message): void { if (!$condition) { throw new RuntimeException($message); } echo "PASS: $message\n"; }
check(journal_slug('Souveraineté & flat-file : l’œuvre') === 'souverainete-flat-file-l-oeuvre', 'slug transliterates French and ligatures');
check(journal_slug('***') === '' && strlen(journal_slug(str_repeat('a ', 100))) <= 80, 'slug is empty for symbols and capped at 80');
$page = ['journal' => [
    ['id' => 'ab12cd34', 'title' => 'Même titre', 'content' => 'x', 'published' => true, 'date' => '2026-11-01'],
    ['id' => 'ef56gh78', 'title' => 'Même titre', 'content' => 'y', 'published' => true, 'date' => '2026-11-02'],
    ['id' => 'zz', 'title' => 'Brouillon', 'content' => 'z', 'published' => false, 'date' => '2026-11-03'],
    ['id' => 'yy', 'title' => 'Vide', 'content' => '  ', 'published' => true, 'date' => '2026-11-03'],
]];
$pub = journal_published($page);
check(array_column($pub, 'slug') === ['meme-titre', 'meme-titre-ef56gh'], 'duplicate titles get an id suffix; drafts and empty articles are excluded');
check(journal_find($page, 'meme-titre-ef56gh')['id'] === 'ef56gh78' && journal_find($page, 'brouillon') === null && journal_find($page, '../x') === null, 'find only resolves published articles by a safe slug');
$html = journal_markdown("# Titre\n**gras** et *it* `c`\n- un\n- deux\n> cite\n<script>alert(1)</script>");
check($html === '<h2>Titre</h2><p><strong>gras</strong> et <em>it</em> <code>c</code></p><ul><li>un</li><li>deux</li></ul><blockquote>cite</blockquote><p>&lt;script&gt;alert(1)&lt;/script&gt;</p>', 'markdown subset matches hub.js and never emits raw HTML');
$clash = journal_published(['journal' => [
    ['id' => 'a', 'title' => 'Note', 'content' => 'x', 'published' => true],
    ['id' => 'abcdef1', 'title' => 'Note', 'content' => 'x', 'published' => true],
    ['id' => 'abcdef2', 'title' => 'Note', 'content' => 'x', 'published' => true],
    ['id' => 'z', 'title' => 'Note abcdef', 'content' => 'x', 'published' => true],
]]);
check(count(array_unique(array_column($clash, 'slug'))) === 4, 'slugs stay unique when id prefixes or titles collide');
