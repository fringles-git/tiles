# GitHub sync and public-root migration

The GitHub PHP repository and the Sites Worker are different deployments. This change adapts the useful Sites/tiles-aistudio concepts to the existing PHP app; it does not replace PHP with a Worker, add a framework, or overwrite current server data.

Retained: richer current GitHub sports gateways and limits, F1 schedule/results, PSG/France coverage, radio, maps, piano artwork, QR, vCard, local flags/logos, project case studies, themes and card sizes. Added: optional Humain → Pro → Créa → Lifestyle universes with URL/back/forward support, editable per-tile classification, Markdown journal/drafts/publication/undo, actual JSON downloads, revision-aware import, drawer focus containment and honest failed-form feedback.

`page.json` remains the single canonical page, including optional `journal` and tile `universe` fields. No destructive page-to-pillars conversion or donor sample articles are introduced. Draft articles are stripped from public server responses. The existing PHP lock/revision/backup mechanism applies to journal edits as well.

`public/widgets.php` is an HTTP entry point, not a reusable library. Only its helpers belong in `src/`. Runtime media deliberately remains outside `public/`, but authorized file types are readable through `public/media.php` and rewritten legacy URLs. This distinction prevents the proposed directory move from breaking every photo and CV link.

No PSR-4/Composer scaffold was added: these are procedural helpers, not namespaced classes. Adding a package manager without actual autoloaded classes would not improve this migration. Shared paths are defined once in `src/paths.php`; the HTML shell template stays private in `src/templates/`.

The old usable seed password hash is replaced with an empty template for **new installs only**. Existing runtime credentials are never overwritten, and the CLI refuses to change an existing administrator. Real configuration remains ignored; a legacy private config file is still accepted to make upgrades safe.

Validation is executable in `tests/js/` and `tests/php/`. In particular the HTTP suite checks the public/private boundary, actual photos/PDFs, HEAD/304, disallowed uploads and symlinks, retained auth, login/session/CSRF, save/revision conflict, journal publication/privacy, uploads and gateway paths using isolated temporary state.
