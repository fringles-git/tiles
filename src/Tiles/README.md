# `Tiles\` namespace (PSR-4)

Classes added to Tiles go here, one class per file, namespace `Tiles\`, as declared in `composer.json`.

Today the code is plain functions in `src/*.php`, loaded with `require_once`: this folder is empty on purpose. Production never runs Composer (no `vendor/` on the server), so a class used at runtime must also be required by the entry point until an autoloader is loaded there.
