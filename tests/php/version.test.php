<?php
declare(strict_types=1);
require dirname(__DIR__, 2) . '/src/version.php';
function check(bool $condition, string $message): void { if (!$condition) { throw new RuntimeException($message); } echo "PASS: $message\n"; }
$root = sys_get_temp_dir() . '/tiles-ver-' . bin2hex(random_bytes(4));
mkdir("$root/.git/refs/heads", 0777, true);
$sha = str_repeat('ab12', 10);
file_put_contents("$root/.git/HEAD", "ref: refs/heads/main\n");
file_put_contents("$root/.git/refs/heads/main", "$sha\n");
check(tiles_commit($root) === substr($sha, 0, 12), 'commit read from the branch ref');
unlink("$root/.git/refs/heads/main");
file_put_contents("$root/.git/packed-refs", "# pack-refs\n$sha refs/heads/main\n");
check(tiles_commit($root) === substr($sha, 0, 12), 'commit read from packed-refs');
file_put_contents("$root/.git/HEAD", "ref: refs/heads/../../etc/passwd\n");
check(tiles_commit($root) === '', 'ref with .. is refused');
file_put_contents("$root/.git/HEAD", "$sha\n");
check(tiles_commit($root) === substr($sha, 0, 12), 'detached HEAD supported');
putenv('TILES_COMMIT=deadbeefcafe1234'); check(tiles_commit('/nonexistent') === 'deadbeefcafe', 'TILES_COMMIT overrides'); putenv('TILES_COMMIT');
check(tiles_commit('/nonexistent') === '', 'no .git gives an empty commit');
mkdir("$root/public/assets/js", 0777, true); file_put_contents("$root/public/assets/js/a.js", "x\n");
check(tiles_assets("$root/public") === ['assets/js/a.js' => substr(sha1("blob 2\0x\n"), 0, 12)], 'asset id equals git hash-object');
exec('rm -rf ' . escapeshellarg($root));
