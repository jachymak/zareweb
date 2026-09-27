<?php
// skautIS login callback ("URL po přihlášení" of the skautIS app). skautIS
// posts the login token here; the web is static, so this passes it on to the
// Administration page in the URL fragment (never sent to any server) and
// stores nothing. On zare-test.skauting.cz (the test skautIS app) it sends
// the token to the local dev server instead.

$web = $_SERVER['HTTP_HOST'] === 'zare-test.skauting.cz'
  ? 'http://localhost:5173'
  : 'https://' . $_SERVER['HTTP_HOST'];
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
