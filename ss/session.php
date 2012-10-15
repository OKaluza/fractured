<?php
$expiry = 60*60*24*30; // 60*60*24*30 = 30 days
$params = session_get_cookie_params();
//session_set_cookie_params($expiry, "/", "fractured.ozone.id.au", false, true);
session_set_cookie_params($expiry, $params["path"], $params["domain"], false, true);
ini_set('session.gc_maxlifetime', $expiry);
session_save_path("/home/ozone/session");
session_start();
/*
//session_set_cookie_params ( int $lifetime [, string $path [, string $domain [, bool $secure = false [, bool $httponly = false ]]]] )
session_start();
*/
?>
