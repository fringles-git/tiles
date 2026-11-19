<?php
declare(strict_types=1);

/** Public sections: URL slug => internal universe key (kept for data compatibility), label and guiding question. */
const TILES_SECTIONS = [
    'profil' => ['key' => 'humain', 'label' => 'Profil', 'question' => 'Qui est vraiment la personne derrière le site et quelle est sa démarche ?'],
    'parcours' => ['key' => 'pro', 'label' => 'Parcours', 'question' => 'Quel est son cheminement, quelles sont ses compétences et qu’a-t-il concrètement accompli ?'],
    'creations' => ['key' => 'crea', 'label' => 'Créations', 'question' => 'Qu’est-ce qu’il fabrique, conçoit ou produit concrètement ?'],
    'passions' => ['key' => 'lifestyle', 'label' => 'Passions', 'question' => 'Qu’est-ce qui l’anime en dehors du cadre formel et nourrit sa curiosité ?'],
];

/** @return array{slug:string,key:string,label:string,question:string}|null */
function section_by_slug(mixed $slug): ?array
{
    if (!is_string($slug) || !isset(TILES_SECTIONS[$slug])) { return null; }
    return ['slug' => $slug] + TILES_SECTIONS[$slug];
}

/** Tile ids assigned to a section before the explicit `universe` field existed (mirror of hub.js `legacy`). */
const TILES_LEGACY_SECTIONS = [
    'humain' => ['f4vi4kt', '4mqulb4', 'sgl7x4k', 'x8yglf1', 'ylannek', 'uu48n57', 'hktzame'],
    'pro' => ['h5wjvno', 'hvjxay8', 'kppny3l', '8wfmcoj', 'o3c3tj4', 'dsu8mgy', '1qjivdm', '6p4sx89', 'edu2026a', 'lang2026a'],
    'crea' => ['c7mleu5', 'dqbsdn1', 'u5p8z5b', 'xy6x628', 'gu7os67', '0ry1y9r', 'n3q4pwv', 'o98bybn', '01v9xrx', 'sezmm2a', 'kti0n15', 'go0rwep', 'tb3awaw', 't45m79z', 'wlg7uyt', 'j8581xd', 'gc7otp1'],
    'lifestyle' => ['wojpaqd', '4j1ho8k', '5h9duug'],
];

/** Section key of a tile, with the same rules as hub.js `universe()`. */
function tile_universe(array $tile): string
{
    $u = $tile['universe'] ?? null;
    if (is_string($u) && in_array($u, ['humain', 'pro', 'crea', 'lifestyle'], true)) { return $u; }
    foreach (TILES_LEGACY_SECTIONS as $key => $ids) { if (in_array($tile['id'] ?? null, $ids, true)) { return $key; } }
    $type = (string) ($tile['type'] ?? '');
    return match (true) {
        in_array($type, ['faith', 'contact', 'map', 'social', 'atlas'], true) => 'humain',
        in_array($type, ['instrument', 'image', 'gallery', 'video', 'music', 'radio'], true) => 'crea',
        in_array($type, ['team', 'sport', 'interest', 'media'], true) => 'lifestyle',
        default => 'pro',
    };
}

/** Tiles of one section; a section heading is kept only when a tile of that section follows it (same as hub.js `filter`). */
function section_tiles(array $tiles, string $key): array
{
    $out = [];
    $heading = null;
    foreach ($tiles as $tile) {
        if (!is_array($tile)) { continue; }
        if (($tile['type'] ?? '') === 'section') { $heading = $tile; continue; }
        if (tile_universe($tile) !== $key) { continue; }
        if ($heading !== null) { $out[] = $heading; $heading = null; }
        $out[] = $tile;
    }
    return $out;
}
