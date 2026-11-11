# Hosting and migration

## Upgrade an existing Hostinger installation

1. Back up the current runtime `data/`, `uploads/` and private configuration outside the public web root. Record the current Git commit.
2. Pull the reviewed repository update. Do not delete, recreate or replace runtime directories. Tracked entry points move into `public/`; their public URLs remain the same.
3. Prefer setting the domain document root to the checkout's `public/` directory. Keep the existing `data/` and `uploads/` one directory above it. If the panel cannot change the document root immediately, retain the new root `.htaccess` fallback and enable `mod_rewrite`; it explicitly forwards public routes/assets/media and denies all other paths.
4. Move an existing `config.local.php` to `config/config.php` when convenient. The old path remains supported if the new file is absent; an explicit `TILES_CONFIG_FILE` takes precedence. Never commit either private file. No action on the existing password is needed.
5. Confirm PHP 8.3+, cURL, GD and fileinfo, and write access to `data/`/`uploads/`. Fresh installations must create an admin via the stdin-only setup script; upgrades must **not** rerun setup or replace `data/auth.json`.
6. Verify `/`, `/admin.php`, `/api.php`, `/widgets.php`, `/assets/js/app.js`, a photo at `/uploads/<name>.jpg` and the CV PDF. Requests for `/data/page.json`, `/config/config.php`, `/seed/data/auth.json` and `/src/lib.php` must fail.

The old URLs `/assets/app.js` and `/assets/app.css` are replaced in newly rendered HTML by `/assets/js/app.js` and `/assets/css/app.css`, with file modification cache keys. Third-party widget, brand and flag paths are calculated relative to their relocated scripts and still support subdirectory hosting. Files in `uploads/` are served only after extension, MIME and real-path checks; PHP/SVG/HTML uploads are never served. HEAD and ETag/304 are supported for photos/PDFs.

## Apache (recommended)

```apache
DocumentRoot /srv/tiles/public
<Directory /srv/tiles/public>
    AllowOverride All
    Require all granted
</Directory>
```

Enable `mod_rewrite` and `mod_headers`, and configure PHP using the host's supported PHP handler. The included public `.htaccess` enforces HTTPS, directory-listing prevention and the legacy upload route. Avoid `AllowOverride None` unless these rules are transcribed into the virtual host.

## Nginx + PHP-FPM

```nginx
root /srv/tiles/public;
index index.php;

location / { try_files $uri $uri/ =404; }
location ~ ^/uploads/([A-Za-z0-9_-]+\.(?:jpe?g|png|webp|gif|pdf))$ {
    include fastcgi_params;
    fastcgi_param SCRIPT_FILENAME $document_root/media.php;
    fastcgi_param QUERY_STRING file=$1;
    fastcgi_pass unix:/run/php/php8.4-fpm.sock;
}
location /uploads/ { return 404; }
location ~ ^/(?:index|admin|api|widgets|media)\.php$ {
    include fastcgi_params;
    fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    fastcgi_pass unix:/run/php/php8.4-fpm.sock;
}
location ~ \.php$ { return 404; }
location ~ /\. { deny all; }
add_header X-Content-Type-Options nosniff always;
add_header Referrer-Policy strict-origin-when-cross-origin always;
```

Use the PHP-FPM socket installed on the host and configure TLS in its virtual host. This is a configuration example, not a claim that server settings have already been changed.

## Data and rollback

The path constants derive from the checkout root, not the server cwd/document root. Tests can isolate state with `TILES_DATA_DIR` and `TILES_UPLOAD_DIR`; ordinary deployments should leave them unset. Seed JSON now lives in `seed/data/` and seed media in `seed/uploads/`. Existing `.seeded` and `patches-applied.json` files retain their meanings and existing patch basenames are unchanged.

Before a code rollback, restore the previous web-root setting or use the entry points expected by that commit. Preserve the newer runtime page/journal JSON, uploads and credentials; do not overwrite live data with seeds. Take a separate data backup before any manual restore. No automatic Hostinger configuration or deployment is performed by this repository update.
