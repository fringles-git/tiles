<?php
declare(strict_types=1);
$tmp = sys_get_temp_dir() . '/tiles-publish-' . bin2hex(random_bytes(4));
mkdir($tmp);
putenv('TILES_DATA_DIR=' . $tmp);
putenv('TILES_UPLOAD_DIR=' . $tmp . '/uploads');
require dirname(__DIR__, 2) . '/src/lib.php';
function check(bool $condition, string $message): void { if (!$condition) { throw new RuntimeException($message); } echo "PASS: $message\n"; }

write_json('page.json', ['rev' => 3, 'profile' => ['bio' => 'live'], 'tiles' => []]);
@unlink(DATA_DIR . '/published.json');
check(published_state() === ['rev' => 0, 'at' => ''], 'no published copy before the first init');

// Editor opened first (admin.php / save run published_init under the lock), then a draft save.
with_lock('page', 'published_init');
write_json('page.json', ['rev' => 4, 'profile' => ['bio' => 'draft'], 'tiles' => []]);
check((public_page()['profile']['bio'] ?? '') === 'live', 'a draft saved before any visit does not become public');
check(published_state()['rev'] === 3, 'published revision is the pre-deploy one');

with_lock('page', 'published_init');
check(read_json('published.json', [])['profile']['bio'] === 'live', 'init never overwrites an existing published copy');

exec('rm -rf ' . escapeshellarg($tmp));
