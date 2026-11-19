<?php
declare(strict_types=1);
require dirname(__DIR__, 2) . '/src/banner.php';
function check(bool $condition, string $message): void { if (!$condition) { throw new RuntimeException($message); } echo "PASS: $message\n"; }
$dir = sys_get_temp_dir() . '/tiles-banner-' . bin2hex(random_bytes(4));
$tmp = tempnam(sys_get_temp_dir(), 'b');
// Build a 2-frame animated GIF by hand: GD can only write single frames.
$frame = static function (int $c): string { $im = imagecreate(400, 100); imagecolorallocate($im, $c, 0, 0); ob_start(); imagegif($im); return (string) ob_get_clean(); };
$a = $frame(255); $b = $frame(10);
$header = substr($a, 0, 13 + 3 * (2 ** ((ord($a[10]) & 7) + 1)));
$body = static fn(string $g): string => substr($g, strpos($g, "\x2C", 13) ?: 13, -1);
$gce = "\x21\xF9\x04\x00\x0A\x00\x00\x00";
file_put_contents($tmp, $header . "\x21\xFF\x0BNETSCAPE2.0\x03\x01\x00\x00\x00" . $gce . $body($a) . $gce . $body($b) . "\x3B");
check(banner_animated((string) file_get_contents($tmp), IMAGETYPE_GIF), 'two-frame GIF detected as animated');
$r = banner_store($tmp, (int) filesize($tmp), $dir);
check(($r['animated'] ?? false) && str_ends_with($r['url'], '.gif') && str_ends_with($r['poster'], '-still.png'), 'animated GIF kept as GIF with a still PNG poster');
check(file_get_contents($dir . '/' . basename($r['url'])) === file_get_contents($tmp), 'GIF bytes are stored unchanged, so animation survives');
file_put_contents($tmp, $a);
check(banner_store($tmp, (int) filesize($tmp), $dir)['animated'] === false, 'single-frame GIF is not animated');
file_put_contents($tmp, '<?php echo 1; ?>');
check(isset(banner_store($tmp, 20, $dir)['error']), 'non-image is rejected');
file_put_contents($tmp, $frame(1)); $small = imagecreate(100, 20); imagecolorallocate($small, 0, 0, 0); imagegif($small, $tmp);
check(isset(banner_store($tmp, (int) filesize($tmp), $dir)['error']), 'too small image is rejected');
check(isset(banner_store($tmp, 9 * 1024 * 1024, $dir)['error']), 'over 8 MB is rejected');
$jpg = imagecreatetruecolor(600, 200); imagejpeg($jpg, $tmp);
$j = banner_store($tmp, (int) filesize($tmp), $dir);
check(str_ends_with($j['url'], '.jpg') && $j['poster'] === $j['url'] && $j['animated'] === false, 'JPEG is re-encoded and is its own poster');
array_map('unlink', glob("$dir/*")); rmdir($dir); unlink($tmp);
