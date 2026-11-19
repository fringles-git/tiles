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
