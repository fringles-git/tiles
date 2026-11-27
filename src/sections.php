<?php
declare(strict_types=1);

/**
 * Default universes: URL slug => internal key (kept for data compatibility), label, accent and guiding question.
 * A page may replace them with its own `universes` list (see tiles_universes()); hub.js mirrors these rules.
 */
const TILES_SECTIONS = [
    'profil' => ['key' => 'humain', 'label' => 'Profil', 'accent' => '#9E5A3F', 'question' => 'Qui est vraiment la personne derrière le site et quelle est sa démarche ?'],
    'parcours' => ['key' => 'pro', 'label' => 'Parcours', 'accent' => '#0B3D91', 'question' => 'Quel est son cheminement, quelles sont ses compétences et qu’a-t-il concrètement accompli ?'],
    'creations' => ['key' => 'crea', 'label' => 'Créations', 'accent' => '#7946BC', 'question' => 'Qu’est-ce qu’il fabrique, conçoit ou produit concrètement ?'],
    'passions' => ['key' => 'lifestyle', 'label' => 'Passions', 'accent' => '#B51E27', 'question' => 'Qu’est-ce qui l’anime en dehors du cadre formel et nourrit sa curiosité ?'],
];

/** Paths a universe slug may never take: existing routes and the journal prefix. */
const TILES_RESERVED_SLUGS = ['admin', 'api', 'go', 'assets', 'uploads', 'media', 'widgets', 'seo', 'version', 'index', 'journal', 'robots', 'sitemap', 'llms', 'data', 'src', 'seed', 'config', 'public'];
const TILES_MAX_UNIVERSES = 12;

/** Default universes as a list, in navigation order. */
function tiles_default_universes(): array
{
    $out = [];
    foreach (TILES_SECTIONS as $slug => $s) { $out[] = ['key' => $s['key'], 'slug' => $slug, 'label' => $s['label'], 'accent' => $s['accent'], 'question' => $s['question']]; }
    return $out;
}

/** True for a well-formed universes list (same rules as hub.js `validUniverses`). */
function valid_universes(mixed $list): bool
{
    if (!is_array($list) || !array_is_list($list) || $list === [] || count($list) > TILES_MAX_UNIVERSES) { return false; }
    $keys = [];
    $slugs = [];
    foreach ($list as $u) {
        if (!is_array($u)) { return false; }
        $key = $u['key'] ?? null;
        $slug = $u['slug'] ?? null;
        $label = $u['label'] ?? null;
        if (!is_string($key) || !preg_match('/\A[a-z][a-z0-9]{0,23}\z/', $key) || isset($keys[$key])) { return false; }
        if (!is_string($slug) || !preg_match('/\A[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?\z/', $slug) || isset($slugs[$slug])
            || in_array($slug, TILES_RESERVED_SLUGS, true) || str_starts_with($slug, 'journal-')) { return false; }
        if (!is_string($label) || trim($label) === '' || mb_strlen($label) > 40) { return false; }
        if (!is_string($u['question'] ?? '') || mb_strlen((string) ($u['question'] ?? '')) > 200) { return false; }
        if (!is_string($u['accent'] ?? '') || !preg_match('/\A(?:#[0-9A-Fa-f]{6})?\z/', (string) ($u['accent'] ?? ''))) { return false; }
        $keys[$key] = true;
        $slugs[$slug] = true;
    }
    return true;
}

/** The page's universes, or the defaults when it has none (or an invalid list). */
function tiles_universes(array $page = []): array
{
    if (!valid_universes($page['universes'] ?? null)) { return tiles_default_universes(); }
    return array_map(static fn(array $u): array => ['key' => $u['key'], 'slug' => $u['slug'], 'label' => trim($u['label']),
        'accent' => (string) ($u['accent'] ?? ''), 'question' => (string) ($u['question'] ?? '')], $page['universes']);
}

/** @return array{slug:string,key:string,label:string,accent:string,question:string}|null */
function section_by_slug(mixed $slug, array $page = []): ?array
{
    if (!is_string($slug)) { return null; }
    foreach (tiles_universes($page) as $u) { if ($u['slug'] === $slug) { return $u; } }
    return null;
}

/** Tile ids assigned to a section before the explicit `universe` field existed (mirror of hub.js `legacy`). */
const TILES_LEGACY_SECTIONS = [
    'humain' => ['f4vi4kt', '4mqulb4', 'sgl7x4k', 'x8yglf1', 'ylannek', 'uu48n57', 'hktzame'],
    'pro' => ['h5wjvno', 'hvjxay8', 'kppny3l', '8wfmcoj', 'o3c3tj4', 'dsu8mgy', '1qjivdm', '6p4sx89', 'edu2026a', 'lang2026a'],
    'crea' => ['c7mleu5', 'dqbsdn1', 'u5p8z5b', 'xy6x628', 'gu7os67', '0ry1y9r', 'n3q4pwv', 'o98bybn', '01v9xrx', 'sezmm2a', 'kti0n15', 'go0rwep', 'tb3awaw', 't45m79z', 'wlg7uyt', 'j8581xd', 'gc7otp1'],
    'lifestyle' => ['wojpaqd', '4j1ho8k', '5h9duug'],
];

/**
 * Universe key of a tile, with the same rules as hub.js `universe()`: explicit field, legacy id, then type.
 * $keys lists the page's universe keys; a result outside it (a deleted default) falls back to the first key.
 */
function tile_universe(array $tile, ?array $keys = null): string
{
    $keys ??= array_column(tiles_default_universes(), 'key');
    $u = $tile['universe'] ?? null;
    if (is_string($u) && in_array($u, $keys, true)) { return $u; }
    $guess = null;
    foreach (TILES_LEGACY_SECTIONS as $key => $ids) { if (in_array($tile['id'] ?? null, $ids, true)) { $guess = $key; break; } }
    $type = (string) ($tile['type'] ?? '');
    $guess ??= match (true) {
        in_array($type, ['faith', 'contact', 'map', 'social', 'atlas', 'clock'], true) => 'humain',
        in_array($type, ['instrument', 'image', 'gallery', 'video', 'music', 'radio'], true) => 'crea',
        in_array($type, ['team', 'sport', 'interest', 'media'], true) => 'lifestyle',
        default => 'pro',
    };
    return in_array($guess, $keys, true) ? $guess : (string) ($keys[0] ?? 'pro');
}

/** Tiles of one section; a section heading is kept only when a tile of that section follows it (same as hub.js `filter`). */
function section_tiles(array $tiles, string $key, ?array $keys = null): array
{
    $out = [];
    $heading = null;
    foreach ($tiles as $tile) {
        if (!is_array($tile)) { continue; }
        if (($tile['type'] ?? '') === 'section') { $heading = $tile; continue; }
        if (tile_universe($tile, $keys) !== $key) { continue; }
        if ($heading !== null) { $out[] = $heading; $heading = null; }
        $out[] = $tile;
    }
    return $out;
}
