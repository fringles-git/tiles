# Benchmark Bento : 23 modèles Framer, recherches et plan — 27 novembre 2026

PR liées : #38 (cartes), #39 (micro-interactions), #40 (éditeur), #41 (stats). Elles sont empilées : merger dans l'ordre.

## Méthode et limites

- 23 sites de la liste, page d'accueil plus au moins une page secondaire pour 9 d'entre eux. Pages lues avec Firecrawl : rendu JavaScript complet, puis extraction du contenu, des liens et, pour Bentofy, des jetons de design.
- **Limite** : un rendu statique ne montre ni les survols, ni les durées d'animation, ni les ressorts Framer. Ces états n'ont pas été mesurés. Ils sont déduits des composants visibles (flèches de carrousel, bouton « Copied! », FAQ « + »). Les durées choisies dans Tiles (180–500 ms, `cubic-bezier(.2,.8,.2,1)`) suivent celles déjà utilisées dans `app.css`.
- Trois liens ne sont pas des Bento : `tavla` (cabinet de conseil), `mosaica` (page de vente d'un cours), `overtake-wbs` (agence). `sunroomtemplate` redirige vers un autre domaine Framer.

## 1. Rapport par site

« Existe » signifie que Tiles le fait déjà : rien n'a été ajouté.

| # | Site | Pages lues | Idées repérées | Suite dans Tiles |
|---|---|---|---|---|
| 1 | gridsandstuff | /, /about | Chiffres clés (50+, 90 %, 10+), cartes projets et journal, **FAQ dépliable « + »** sur deux pages | FAQ → #38 |
| 2 | gridly.framer.ai | /, /projects | Badge « Available for work », **trois chiffres**, étude de cas mise en avant, outils, témoignages, compteur ludique « 2/3 cafés aujourd'hui », projets avec année et tags | Chiffres animés → #38 ; compteur ludique non retenu |
| 3 | bentfolio | / | Profil et disponibilité, projets vers pages détail, services, outils, témoignages, chiffres (95 %, 24+, 10+), réseaux | Chiffres animés → #38 |
| 4 | usenoku | / | Carte **« Location — GMT+1 »**, expérience « 3 yrs », « Elsewhere » (réseaux), carte contact | Heure locale → #38 |
| 5 | frameteam | /, /projects/oak-stone | Grands projets, nombre d'archives (12), récompenses, CTA « LET'S TALK » avec e-mail, **carrousel de témoignages avec flèches**, fiche projet (année, type, rôle, outil) et **« More projects »** en bas | Carrousel et « projet suivant » → plan |
| 6 | bentory | / | Une seule page, chiffres dont **« temps de réponse »**, AVAILABLE + « Let's talk » | Bloc « Big number » existant |
| 7 | bentovibe | /, /stack | « 100 % Happy Clients », galerie de modèles, pages stack et tutoriels | Rien de nouveau |
| 8 | bentofy | /, /bio, /stack, /404 | Stack **par catégories** avec liens affiliés, boutique, blog, **page 404 personnalisée** avec « Go Home » ; jetons extraits : rayon 20 px, unité de base 4 px | 404 → plan ; produits : bloc Product existant |
| 9 | overtake-wbs | / | Agence : études de cas et blog, pas de grille Bento | — |
| 10 | bentox | /, /about | Carte newsletter, ressources, **« Copy email → Copied! »**, flèches sur /about | Copie + toast existe ; inscription : bloc Email signup existant |
| 11 | sunroomtemplate | / | Page unique, « Request résumé » par e-mail pré-rempli | Bloc CV existant |
| 12 | tilework-portfolio | / | Disponibilité avec **créneaux freelance restants**, chiffres, projet, outils, témoignage, CTA | Créneaux → plan |
| 13 | bisque-breakfast (Bentofolio) | / | **Lieu et heure (UTC+1)**, « En ce moment », **progression 72 %**, réseaux, outils | Heure locale et progression → #38 ; « Now » existe |
| 14 | tavla | / | Conseil (Linden), pas de grille Bento | — |
| 15 | mosaica | / | Page de vente d'un cours (tarifs, programme), pas de grille Bento | — |
| 16 | benbox | / | Badge disponible, photo, études de cas, **services en carrousel**, CV, réseaux | Carrousel → plan |
| 17 | zento | /, /services | Outils, galerie, services, chiffres (56+, 23+, 06+), profil (langues, fuseau IST), boutons Telegram/WhatsApp, témoignages, **5 étapes de méthode**, CTA e-mail + rendez-vous | Méthode → #38 ; langues et rendez-vous existent |
| 18 | desirable-goal | / | Disponibilité, projet, services, **process**, preuves, principes, contact | Méthode → #38 |
| 19 | bento-folioo | / | Sombre, frise, compétences, **services avec prix**, **méthode en 6 étapes**, chiffres, projets, témoignages, **FAQ** | FAQ et méthode → #38 ; services tarifés → plan |
| 20 | boundless | /services | Services avec prix et CTA, indicateurs (taux de réussite, temps de chargement), témoignages, **FAQ** | FAQ → #38 |
| 21 | bentoze | / | Intro, projets, chiffres, expertises, témoignages en carrousel, derniers articles | Journal existe |
| 22 | frento | /, /all-blocks | Link-in-bio : réseaux, aperçus YouTube, carrousels, **contributions GitHub**, tarifs ; **catalogue de blocs** sur une page | Recherche de blocs → #40 ; GitHub → plan |
| 23 | glowlinkbento | / | Créateur UGC : 4 chiffres d'audience, reels, logos de marques, témoignages en carrousel, **formulaire de contact avec message**, 404, CGU | Formulaire → plan ; logos : bibliothèque existante |

**Constantes Bento observées** : CSS Grid, cartes de tailles variées, un même rayon partout (Bentofy : 20 px), écart régulier, disponibilité en haut, CTA de contact en dernière carte. Tiles respecte déjà ces règles : `--r` et `--gap` réglables, 5 tailles, grille dense.

## 2. Recherches complémentaires

| Sujet | Constat | Effet sur Tiles |
|---|---|---|
| Analytics Linktree | Taux de clic, référents, appareils et export CSV, par lien comme par profil. Plage de dates personnalisée réservée aux offres payantes. [Aide Linktree](https://linktr.ee/help/en/articles/5434172-individual-link-insights), [export CSV](https://intercom.help/linktree-ff524ba1864c/en/articles/5707122-download-a-csv-of-your-insights-activity) | Sources, appareils, visiteurs, taux par bloc → #41 ; CSV → plan |
| Marché | Bento.me (grilles redimensionnables) a fermé le 13 février 2026 après son rachat par Linktree. Les pages ont été redirigées vers Linktree. [AlternativeTo](https://alternativeto.net/news/2025/12/bento-to-shut-down-in-2026-as-linktree-takes-over-and-offers-migration-path) | Place libre pour un link-in-bio Bento : argument SaaS central |
| Comptage sans cookie | Plausible et ses équivalents : hachage avec un sel aléatoire changé chaque jour, aucune IP stockée. Les visiteurs uniques sont des estimations par jour. [Plausible](https://plausible.io/data-policy) | Modèle repris dans #41, limite écrite dans l'infobulle |
| View Transitions | Baseline depuis octobre 2025 : Chrome 111, Safari 18, Firefox 144. [web.dev](https://web.dev/blog/same-document-view-transitions-are-now-baseline-newly-available) | #39 avec repli instantané |
| Glisser-déposer accessible | Toujours une alternative clavier ou boutons, focus gardé sur l'élément déplacé, position annoncée. [Primer](https://primer.style/accessibility/patterns/drag-and-drop), [Smashing](https://www.smashingmagazine.com/2018/01/dragon-drop-accessible-list-reordering/) | Alt + flèches et annonce → #40 ; les boutons ◀ ▶ existaient |
| Hiérarchie Bento sur mobile | En une colonne, garder des hauteurs variées pour conserver la hiérarchie. [SaaSFrame](https://www.saasframe.io/blog/designing-bento-grids-that-actually-work-a-2026-practical-guide) | Hauteurs guidées par le contenu (`def.flow`) pour les nouveaux blocs |

## 3. Plan priorisé

Effort : S < ½ j, M ½–2 j, L > 2 j. Impact UX : ★ à ★★★.

### Livré

| Fonction | Côté | Effort | Impact | PR |
|---|---|---|---|---|
| FAQ, progression, méthode, heure locale | public + éditeur | S | ★★★ | #38 |
| Chiffres animés (visibles, accessibles) | public | S | ★★ | #38 |
| Transitions entre filtres et sections | public | S | ★★ | #39 |
| Halo sous le pointeur, apparition échelonnée | public | S | ★ | #39 |
| Annuler / rétablir (80 étapes) | éditeur | S | ★★★ | #40 |
| Alt + flèches, déplacement tactile par appui long | éditeur | M | ★★★ | #40 |
| Recherche dans « Add block » | éditeur | S | ★★ | #40 |
| Visiteurs uniques, sources, appareils, taux par bloc | stats | M | ★★★ | #41 |

### Déjà présent (vérifié dans le code, non refait)

Aperçu en direct, duplication, choix du type à la création, glisser-déposer à la souris, boutons de taille, masquage et programmation des blocs, témoignages, statut de disponibilité, horaires d'ouverture, recherche avec suggestions et état vide, `prefers-reduced-motion`, `:focus-visible`, contrastes AA testés, CSRF et session admin.

### Suite proposée

| # | Fonction | Inspiration | Effort | Impact | Modèle SaaS |
|---|---|---|---|---|---|
| 1 | Brouillon / publié pour toute la page (`draft.json`, bouton Publier) | demande initiale | M | ★★★ | Base du multi-comptes |
| 2 | Export CSV des stats | Linktree | S | ★★ | Offre payante |
| 3 | Page 404 personnalisée avec recherche | Bentofy, GlowLink | S | ★★ | — |
| 4 | Carrousel de témoignages (`scroll-snap`, bouton pause) | FRAME TEAM, Bentoze, GlowLink | S | ★★ | — |
| 5 | Formulaire de contact avec message (piège à robots, limite de débit) | GlowLink | M | ★★★ | Leads, offre payante |
| 6 | « Projet suivant » en bas des études de cas | FRAME TEAM | S | ★★ | — |
| 7 | Disponibilité avec créneaux restants | Tilework | S | ★ | — |
| 8 | Services tarifés | Bento Folio, Boundless | S | ★★ | Prise de commande |
| 9 | Contributions GitHub (cache `widget-cache.php`) | Frento | M | ★ | — |
| 10 | Redimensionnement par poignée | demande initiale | M | ★ | Les boutons S/W/T/L couvrent le besoin |
| 11 | Édition dans la tuile (`contenteditable`) | demande initiale | M | ★★ | Risque : validation et collage de HTML |

Freemium possible : 7 jours de stats en gratuit ; 30/90 jours, sources, appareils et CSV en payant (Linktree réserve aussi la plage personnalisée aux offres payantes).

## 4. Décisions techniques

- **Pas de SQL.** Tiles stocke tout en JSON (`data/*.json`, verrous, sauvegardes). Les nouvelles séries vivent dans `stats.json` avec la rétention existante de 120 jours. Les clés visiteur du jour peuvent ajouter jusqu'à environ 1 Mo les jours de fort trafic. Avant le multi-comptes, passer les stats à SQLite (une ligne par jour, par page et par catégorie).
- **Modules sans build** : `bento.js` (public) et `editor.js` (admin seulement) s'enregistrent comme `experience.js`. `app.js` ne change que de quelques lignes.
- **Mouvement** : toute animation est déclarée dans `prefers-reduced-motion: no-preference`, y compris les View Transitions.
- **Accessibilité** : FAQ en `<details>` natif, barres de progression `aria-hidden` avec la valeur en texte, chiffres animés doublés d'un `sr-only`, position annoncée après chaque déplacement, focus gardé sur le bloc déplacé.
- **Sécurité** : toutes les chaînes des nouveaux blocs passent par `esc()` (testé avec une charge `onerror`). Les sources de visite sont une liste fermée. Les identifiants de tuile sont filtrés avant de servir de noms CSS.

## 5. Vérifier

- `npm run test:js` : `bento.test.cjs` et `editor.test.cjs`.
- `npm run test:php` : `stats.test.php` (19 nouveaux contrôles).
- Étapes manuelles : section « Tester » de chaque PR.
