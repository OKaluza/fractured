<?php
include("session.php");

$api_key    = "a1c3659bf97b2cc89addf54a0b00ffce";
$api_secret = "f82db0f32294efbf";

require_once("phpFlickr.php");
$f = new phpFlickr($api_key, $api_secret);
$f->auth("write");

echo "Authenticated: " . $_SESSION['phpFlickr_auth_token'];
?>
