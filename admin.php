<?php
declare(strict_types=1);
require __DIR__ . '/lib.php';

start_session();
header('X-Frame-Options: DENY');
header('Cache-Control: no-store');

$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['password'])) {
    if (!hash_equals($_SESSION['csrf'], (string) ($_POST['csrf'] ?? ''))) {
        $error = 'Your session expired. Try again.';
    } else {
        $result = with_lock('login', function () {
            $state = read_json('login.json', ['fails' => 0, 'until' => 0]);
            if (time() < (int) ($state['until'] ?? 0)) {
                return 'locked';
            }
            $auth = read_json('auth.json', []);
            if (!empty($auth['hash']) && password_verify((string) $_POST['password'], (string) $auth['hash'])) {
                write_json('login.json', ['fails' => 0, 'until' => 0]);
                return 'ok';
            }
            $fails = (int) ($state['fails'] ?? 0) + 1;
            write_json('login.json', $fails >= 5
                ? ['fails' => 0, 'until' => time() + 600]
                : ['fails' => $fails, 'until' => 0]);
            return 'wrong';
        });
        if ($result === 'ok') {
            session_regenerate_id(true);
            $_SESSION['admin'] = true;
            header('Location: admin.php');
            exit;
        }
        usleep(700000);
        $error = $result === 'locked'
            ? 'Too many attempts. Wait 10 minutes and try again.'
            : 'Wrong password.';
    }
}

if (!is_admin()) {
    header('Content-Type: text/html; charset=utf-8');
    ?><!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Tiles · Log in</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700&family=Figtree:wght@400;600;700&display=swap">
<style>
:root{--bg:#ECEEF1;--surface:#fff;--fg:#14161A;--muted:#656B75;--line:rgba(18,22,30,.1);--accent:#0B7A75;--danger:#D6363F}
@media (prefers-color-scheme:dark){:root{--bg:#0E1013;--surface:#171A1F;--fg:#F0F2F5;--muted:#99A0AA;--line:rgba(255,255,255,.1);color-scheme:dark}}
*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:var(--bg);color:var(--fg);font:15px/1.45 Figtree,system-ui,sans-serif;padding:16px}
form{width:min(360px,100%);background:var(--surface);border:1px solid var(--line);border-radius:24px;padding:28px;display:flex;flex-direction:column;gap:14px;box-shadow:0 10px 40px -20px rgba(0,0,0,.3)}
.mark{width:30px;height:30px;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:3px}.mark i{background:var(--fg);border-radius:4px}.mark i:first-child{grid-row:span 2;background:var(--accent)}
h1{font-family:"Bricolage Grotesque",sans-serif;font-size:26px;margin:0;letter-spacing:-.02em}
label{font-size:12px;font-weight:700;color:var(--muted)}
input{width:100%;border:1px solid var(--line);background:transparent;border-radius:12px;padding:11px 12px;font:inherit;color:inherit}
input:focus-visible,button:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
button{border:0;border-radius:999px;padding:11px;background:var(--fg);color:var(--bg);font:inherit;font-weight:700;cursor:pointer}
.err{color:var(--danger);font-weight:600;font-size:13px;margin:0}
</style>
</head>
<body>
<form method="post" action="admin.php">
  <span class="mark"><i></i><i></i><i></i></span>
  <h1>Tiles</h1>
  <input type="hidden" name="csrf" value="<?= e($_SESSION['csrf']) ?>">
  <div style="display:flex;flex-direction:column;gap:6px">
    <label for="password">Password</label>
    <input id="password" name="password" type="password" autocomplete="current-password" required autofocus>
  </div>
  <?php if ($error !== ''): ?><p class="err" role="alert"><?= e($error) ?></p><?php endif; ?>
  <button type="submit">Log in</button>
</form>
</body>
</html>
<?php
    exit;
}

$page = read_json('page.json', null);
render_shell(
    'Tiles · Editor',
    'Editor',
    ['mode' => 'admin', 'page' => $page, 'stats' => stats_for_editor(), 'csrf' => $_SESSION['csrf']],
    '<meta name="robots" content="noindex">'
);
