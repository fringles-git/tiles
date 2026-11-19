<?php
declare(strict_types=1);

/** True when a GIF or WebP file holds more than one frame. */
function banner_animated(string $bytes, int $type): bool
{
    if ($type === IMAGETYPE_GIF) { return substr_count($bytes, "\x00\x21\xF9\x04") > 1; }
    if ($type === IMAGETYPE_WEBP) { return str_contains(substr($bytes, 0, 64), 'ANIM') || str_contains($bytes, 'ANMF'); }
    return false;
}

/**
 * Store a profile banner. GIF and WebP are kept byte for byte so animation survives
 * (GD would flatten them to one frame); a still poster is extracted for reduced motion.
 * JPEG and PNG are re-encoded like other uploads. Returns url, poster, animated, or error.
 */
function banner_store(string $tmp, int $size, string $dir): array
{
    if ($size <= 0 || $size > 8 * 1024 * 1024) { return ['error' => 'La bannière dépasse 8 Mo.']; }
    $info = @getimagesize($tmp);
    $type = (int) ($info[2] ?? 0);
    $mime = [IMAGETYPE_GIF => 'image/gif', IMAGETYPE_WEBP => 'image/webp', IMAGETYPE_PNG => 'image/png', IMAGETYPE_JPEG => 'image/jpeg'][$type] ?? null;
    if ($mime === null || (new finfo(FILEINFO_MIME_TYPE))->file($tmp) !== $mime) { return ['error' => 'Utilise une image GIF, WebP, PNG ou JPEG.']; }
    [$w, $h] = [(int) $info[0], (int) $info[1]];
    if ($w < 300 || $h < 60 || $w > 4000 || $h > 4000) { return ['error' => 'La bannière doit mesurer entre 300 et 4000 px de large.']; }
    if (!is_dir($dir) && !mkdir($dir, 0755, true)) { return ['error' => 'Impossible de créer le dossier des fichiers.']; }
    $id = bin2hex(random_bytes(8));
    $bytes = (string) file_get_contents($tmp);
    $still = match ($type) {
        IMAGETYPE_GIF => @imagecreatefromgif($tmp),
        IMAGETYPE_WEBP => function_exists('imagecreatefromwebp') ? @imagecreatefromwebp($tmp) : false,
        IMAGETYPE_PNG => @imagecreatefrompng($tmp),
        default => @imagecreatefromjpeg($tmp),
    };
    if (in_array($type, [IMAGETYPE_GIF, IMAGETYPE_WEBP], true)) {
        $ext = $type === IMAGETYPE_GIF ? 'gif' : 'webp';
        if (file_put_contents("$dir/banner-$id.$ext", $bytes) === false) { return ['error' => 'Le serveur n’a pas pu enregistrer la bannière.']; }
        $url = "uploads/banner-$id.$ext";
        $poster = '';
        if ($still) {
            imagesavealpha($still, true);
            if (imagepng($still, "$dir/banner-$id-still.png", 7)) { $poster = "uploads/banner-$id-still.png"; }
        }
        return ['url' => $url, 'poster' => $poster ?: $url, 'animated' => banner_animated($bytes, $type)];
    }
    if (!$still) { return ['error' => 'Image illisible.']; }
    if ($type === IMAGETYPE_JPEG && function_exists('exif_read_data')) {
        $rot = [3 => 180, 6 => -90, 8 => 90][(int) ((@exif_read_data($tmp) ?: [])['Orientation'] ?? 1)] ?? 0;
        if ($rot) { $still = imagerotate($still, $rot, 0) ?: $still; }
    }
    if ($type === IMAGETYPE_PNG) { imagealphablending($still, false); imagesavealpha($still, true); }
    $ext = $type === IMAGETYPE_PNG ? 'png' : 'jpg';
    $ok = $type === IMAGETYPE_PNG ? imagepng($still, "$dir/banner-$id.$ext", 7) : imagejpeg($still, "$dir/banner-$id.$ext", 84);
    if (!$ok) { return ['error' => 'Le serveur n’a pas pu enregistrer la bannière.']; }
    return ['url' => "uploads/banner-$id.$ext", 'poster' => "uploads/banner-$id.$ext", 'animated' => false];
}
