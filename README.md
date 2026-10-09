# Tiles

Bento-style link-in-bio and portfolio for brandonlazarre.fr, in vanilla JS + PHP with no dependencies.

- `index.php`: public page
- `admin.php`: password-protected editor (autosaves to the server)
- `api.php`: save, image upload, visit and click tracking, email signups
- `seed/`: starting content, copied into `data/` and `uploads/` on first run

Runtime files in `data/` and `uploads/` are not tracked, so deploying new code never overwrites edits, photos, stats or the password.
