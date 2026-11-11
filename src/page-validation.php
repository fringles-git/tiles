<?php
declare(strict_types=1);

/** Validate optional journal data without changing the existing page/storage contract. */
function valid_page(array $page): bool
{
    if (!is_array($page['profile'] ?? null) || !is_array($page['tiles'] ?? null) || !array_is_list($page['tiles']) || count($page['tiles']) > 500) { return false; }
    $ids = [];
    foreach ($page['tiles'] as $tile) {
        if (!is_array($tile) || !is_string($tile['id'] ?? null) || !preg_match('/\A[A-Za-z0-9_-]{1,64}\z/', $tile['id'])
            || isset($ids[$tile['id']]) || !is_string($tile['type'] ?? null) || !is_array($tile['data'] ?? null)) { return false; }
        $ids[$tile['id']] = true;
        if (isset($tile['universe']) && !in_array($tile['universe'], ['humain', 'pro', 'crea', 'lifestyle'], true)) { return false; }
    }
    if (!array_key_exists('journal', $page)) { return true; }
    if (!is_array($page['journal']) || !array_is_list($page['journal']) || count($page['journal']) > 200) { return false; }
    $ids = [];
    foreach ($page['journal'] as $entry) {
        if (!is_array($entry) || !is_string($entry['id'] ?? null) || !preg_match('/\A[A-Za-z0-9_-]{1,64}\z/', $entry['id']) || isset($ids[$entry['id']])
            || !in_array($entry['universe'] ?? null, ['humain', 'pro', 'crea', 'lifestyle'], true) || !is_bool($entry['published'] ?? null)) { return false; }
        foreach (['title' => 200, 'excerpt' => 500, 'content' => 100000] as $key => $limit) {
            if (!is_string($entry[$key] ?? null) || preg_match_all('/./us', $entry[$key]) > $limit) { return false; }
        }
        $date = is_string($entry['date'] ?? null) ? DateTimeImmutable::createFromFormat('!Y-m-d', $entry['date']) : false;
        if (!$date || $date->format('Y-m-d') !== $entry['date']) { return false; }
        $ids[$entry['id']] = true;
    }
    return true;
}
