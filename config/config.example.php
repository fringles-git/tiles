<?php
// Copy to config/config.php, or use FOOTBALL_DATA_TOKEN in the server environment.
// Never commit config/config.php or paste the token in the browser/editor.
return [
    'football_token' => '',
    // Canonical public origin used in canonical links, sitemap.xml and structured data (https, no path).
    // 'site_url' => 'https://brandonlazarre.fr',
    // Deployment mode: 'full' (default), 'public' (page only, no admin) or 'admin' (public pages 301 to site_url).
    // 'mode' => 'full',
    // Absolute paths, to share the data of another install on the same server (used with 'mode' => 'public').
    // 'data_dir' => '/home/uXXXX/domains/tiles.brandonlazarre.fr/tiles/data',
    // 'upload_dir' => '/home/uXXXX/domains/tiles.brandonlazarre.fr/tiles/uploads',
    // Exact IP addresses of a reverse proxy or CDN in front of PHP. Only these may set X-Forwarded-Proto.
    // Leave empty when PHP sees HTTPS directly (Hostinger). Environment: TILES_TRUSTED_PROXIES=ip1,ip2
    // 'trusted_proxies' => [],
    // Content Security Policy: 'report' (default, console warnings only), 'enforce' or 'off'. Environment: TILES_CSP
    // 'csp' => 'report',
    // Optional extra teams. IDs must come from football-data.org, not another provider.
    // 'teams' => ['my-club' => ['id' => 1234, 'name' => 'My club', 'url' => 'https://club.example/']],
];
