<?php
// skautIS login callback ("URL po přihlášení" of the skautIS app). skautIS
// posts the login token here; the web is static, so this passes it on to the
// Administration page in the URL fragment (never sent to any server) and
// stores nothing.
//
// Development: opening this page with `?vyvoj=1` sets a cookie in that browser
// only, after which logins from it go to the local dev server instead
// (`?vyvoj=0` turns it off). There is no test skautIS app any more.

$dev = 'http://localhost:5173';
if (isset($_GET['vyvoj'])) {
  $on = $_GET['vyvoj'] === '1';
  setcookie('skautis_vyvoj', $on ? '1' : '', [
    'expires' => $on ? time() + 30 * 24 * 3600 : 1,
    'path' => '/skautis/',
    'secure' => true,
    'httponly' => true,
    'samesite' => 'None', // skautIS posts the login here from its own site
  ]);
  header('Content-Type: text/plain; charset=utf-8');
  echo $on
    ? "Přihlášení přes skautIS z tohoto prohlížeče teď vede na $dev (vypnout: ?vyvoj=0)."
    : 'Přihlášení přes skautIS vede zase na tento web.';
  exit;
}

$web = ($_COOKIE['skautis_vyvoj'] ?? '') === '1' ? $dev : 'https://' . $_SERVER['HTTP_HOST'];
$target = $web . '/vedouci/administrace';

$guid = '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i';
$token = $_POST['skautIS_Token'] ?? '';

header('Cache-Control: no-store');
header('Referrer-Policy: no-referrer');
if (!preg_match($guid, $token)) {
  header('Location: ' . $target, true, 303);
  exit;
}
$fragment = http_build_query([
  'skautis' => $token,
  'role' => preg_replace('/\D/', '', $_POST['skautIS_IDRole'] ?? ''),
  'unit' => preg_replace('/\D/', '', $_POST['skautIS_IDUnit'] ?? ''),
]);
header('Location: ' . $target . '#' . $fragment, true, 303);
