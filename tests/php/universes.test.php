<?php
declare(strict_types=1);
require dirname(__DIR__, 2) . '/src/page-validation.php';
function check(bool $condition, string $message): void { if (!$condition) { throw new RuntimeException($message); } echo "PASS: $message\n"; }
$custom = [['key' => 'engage', 'slug' => 'engagement', 'label' => 'Engagement', 'accent' => '', 'question' => 'TBD'], ['key' => 'pro', 'slug' => 'parcours', 'label' => 'Parcours']];
check(array_column(tiles_universes([]), 'slug') === ['profil', 'parcours', 'creations', 'passions'], 'pages without universes keep the four defaults in order');
check(array_column(tiles_universes(['universes' => $custom]), 'key') === ['engage', 'pro'], 'a page list replaces the defaults and keeps its order');
check(array_column(tiles_universes(['universes' => [['key' => 'x', 'slug' => 'api', 'label' => 'X']]]), 'slug')[0] === 'profil', 'an invalid list never reaches the public page');
check(section_by_slug('engagement', ['universes' => $custom])['label'] === 'Engagement' && section_by_slug('profil', ['universes' => $custom]) === null && section_by_slug('profil')['key'] === 'humain', 'slugs resolve against the page universes');
$page = ['profile' => [], 'tiles' => [['id' => 'a', 'type' => 'link', 'universe' => 'engage', 'data' => []]], 'universes' => $custom];
check(valid_page($page), 'tiles may use a custom universe');
check(!valid_page(['universes' => null] + $page) && !valid_page(['universes' => []] + $page), 'an explicit universes key must be a valid list');
check(!valid_page(['tiles' => [['id' => 'a', 'type' => 'link', 'universe' => 'lifestyle', 'data' => []]]] + $page), 'a tile cannot point to a universe the page removed');
check(valid_page(['profile' => [], 'tiles' => [['id' => 'a', 'type' => 'link', 'universe' => 'crea', 'data' => []]]]), 'existing pages without universes still validate');
$journal = [['id' => 'j', 'title' => 'T', 'excerpt' => '', 'content' => 'c', 'date' => '2026-11-27', 'universe' => 'engage', 'published' => false]];
check(valid_page(['journal' => $journal] + $page) && !valid_page(['journal' => [['universe' => 'humain'] + $journal[0]]] + $page), 'journal articles follow the same rule');
check(tile_universe(['id' => 'b', 'type' => 'sport'], ['engage', 'pro']) === 'engage', 'a guessed default that the page removed falls back to its first universe');
