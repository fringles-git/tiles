<?php
declare(strict_types=1);
require __DIR__ . '/lib.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

function out(array $data, int $code = 200): void
{
    http_response_code($code);
    echo json_encode(['ok' => $code < 400] + $data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    out(['error' => 'Use POST.'], 405);
}

$action = (string) ($_GET['action'] ?? '');
$raw = (string) file_get_contents('php://input', false, null, 0, 6000000);

/* ---------- Public: visit and click tracking, email signups ---------- */

if ($action === 'track') {
    $in = json_decode($raw, true);
    $type = is_array($in) ? (string) ($in['type'] ?? '') : '';
    $id = is_array($in) ? (string) ($in['id'] ?? '') : '';
    if ($type === 'click') {
        if (!preg_match('/^[a-z0-9]{1,24}$/', $id)) {
            out(['error' => 'Bad id.'], 400);
        }
        $ids = array_column(read_json('page.json', ['tiles' => []])['tiles'] ?? [], 'id');
        if (!in_array($id, $ids, true)) {
            out(['error' => 'Unknown block.'], 400);
        }
    } elseif ($type !== 'view') {
        out(['error' => 'Bad type.'], 400);
    }
    with_lock('stats', function () use ($type, $id) {
        $st = read_json('stats.json', ['views' => 0, 'days' => [], 'clicks' => []]);
        if ($type === 'view') {
            $day = gmdate('Y-m-d');
            $st['views'] = (int) ($st['views'] ?? 0) + 1;
            $st['days'][$day] = (int) ($st['days'][$day] ?? 0) + 1;
            $cut = gmdate('Y-m-d', time() - 120 * 86400);
            $st['days'] = array_filter($st['days'], fn($k) => $k >= $cut, ARRAY_FILTER_USE_KEY);
        } else {
            $st['clicks'][$id] = (int) ($st['clicks'][$id] ?? 0) + 1;
        }
        write_json('stats.json', $st);
    });
    out([]);
}

if ($action === 'lead') {
    $in = json_decode($raw, true);
    $email = trim((string) ($in['email'] ?? ''));
    if (strlen($email) > 200 || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        out(['error' => 'Enter a valid email address.'], 400);
    }
    with_lock('leads', function () use ($email) {
        $leads = read_json('leads.json', []);
        foreach ($leads as $l) {
            if (strcasecmp((string) ($l['email'] ?? ''), $email) === 0) {
                return;
            }
        }
        if (count($leads) < 5000) {
            $leads[] = ['email' => $email, 'at' => gmdate('c')];
            write_json('leads.json', $leads);
        }
    });
    out([]);
}

/* ---------- Admin only ---------- */

start_session();
if (!is_admin()) {
    out(['error' => 'You are logged out. Reload the page and log in again.'], 401);
}
if (!hash_equals($_SESSION['csrf'], (string) ($_SERVER['HTTP_X_CSRF'] ?? ''))) {
    out(['error' => 'Your session expired. Reload the page.'], 403);
}

switch ($action) {
    case 'save':
        $in = json_decode($raw, true);
        $page = is_array($in) ? ($in['page'] ?? null) : null;
        if (!is_array($page) || !isset($page['tiles']) || !is_array($page['tiles']) || !is_array($page['profile'] ?? null)) {
            out(['error' => 'The page data is invalid.'], 400);
        }
        unset($page['stats']);
        with_lock('page', function () use ($page) {
            if (!is_dir(DATA_DIR . '/backups')) {
                mkdir(DATA_DIR . '/backups', 0755, true);
            }
            $current = DATA_DIR . '/page.json';
            $backups = glob(DATA_DIR . '/backups/page-*.json') ?: [];
            $last = $backups ? max(array_map('filemtime', $backups)) : 0;
            if (is_file($current) && time() - $last > 600) {
                copy($current, DATA_DIR . '/backups/page-' . gmdate('Ymd-His') . '.json');
                $backups = glob(DATA_DIR . '/backups/page-*.json') ?: [];
                sort($backups);
                foreach (array_slice($backups, 0, max(0, count($backups) - 40)) as $old) {
                    @unlink($old);
                }
            }
            if (!write_json('page.json', $page)) {
                out(['error' => 'The server could not write the page file.'], 500);
            }
        });
        out([]);

    case 'upload':
        $f = $_FILES['file'] ?? null;
        if (!$f || ($f['error'] ?? 1) !== UPLOAD_ERR_OK || !is_uploaded_file($f['tmp_name'])) {
            out(['error' => 'The upload did not arrive.'], 400);
        }
        if ($f['size'] > 25 * 1024 * 1024) {
            out(['error' => 'The image is larger than 25 MB.'], 400);
        }
        $info = @getimagesize($f['tmp_name']);
        $type = $info[2] ?? 0;
        $img = match ($type) {
            IMAGETYPE_JPEG => @imagecreatefromjpeg($f['tmp_name']),
            IMAGETYPE_PNG => @imagecreatefrompng($f['tmp_name']),
            IMAGETYPE_WEBP => function_exists('imagecreatefromwebp') ? @imagecreatefromwebp($f['tmp_name']) : false,
            IMAGETYPE_GIF => @imagecreatefromgif($f['tmp_name']),
            default => false,
        };
        if (!$img) {
            out(['error' => 'Use a JPEG, PNG, WebP or GIF image.'], 400);
        }
        if ($type === IMAGETYPE_JPEG && function_exists('exif_read_data')) {
            $exif = @exif_read_data($f['tmp_name']);
            $rot = [3 => 180, 6 => -90, 8 => 90][(int) ($exif['Orientation'] ?? 1)] ?? 0;
            if ($rot) {
                $img = imagerotate($img, $rot, 0);
            }
        }
        $max = max(300, min(2400, (int) ($_POST['max'] ?? 1600)));
        $w = imagesx($img);
        $h = imagesy($img);
        $scale = min(1, $max / max($w, $h));
        if ($scale < 1) {
            $nw = (int) round($w * $scale);
            $nh = (int) round($h * $scale);
            $dst = imagecreatetruecolor($nw, $nh);
            imagealphablending($dst, false);
            imagesavealpha($dst, true);
            imagecopyresampled($dst, $img, 0, 0, 0, 0, $nw, $nh, $w, $h);
            $img = $dst;
        }
        if (!is_dir(UPLOAD_DIR)) {
            mkdir(UPLOAD_DIR, 0755, true);
        }
        $keepAlpha = in_array($type, [IMAGETYPE_PNG, IMAGETYPE_GIF], true);
        $name = bin2hex(random_bytes(8)) . ($keepAlpha ? '.png' : '.jpg');
        $ok = $keepAlpha
            ? imagepng($img, UPLOAD_DIR . '/' . $name, 7)
            : imagejpeg($img, UPLOAD_DIR . '/' . $name, 84);
        if (!$ok) {
            out(['error' => 'The server could not save the image.'], 500);
        }
        out(['url' => 'uploads/' . $name]);

    case 'reset-stats':
        with_lock('stats', fn() => write_json('stats.json', ['views' => 0, 'days' => [], 'clicks' => []]));
        out([]);

    case 'password':
        $in = json_decode($raw, true);
        $current = (string) ($in['current'] ?? '');
        $next = (string) ($in['next'] ?? '');
        $auth = read_json('auth.json', []);
        if (empty($auth['hash']) || !password_verify($current, (string) $auth['hash'])) {
            usleep(700000);
            out(['error' => 'The current password is wrong.'], 400);
        }
        if (strlen($next) < 10) {
            out(['error' => 'Use at least 10 characters.'], 400);
        }
        write_json('auth.json', ['hash' => password_hash($next, PASSWORD_DEFAULT)]);
        out([]);

    case 'logout':
        $_SESSION = [];
        session_destroy();
        out([]);
}

out(['error' => 'Unknown action.'], 404);
