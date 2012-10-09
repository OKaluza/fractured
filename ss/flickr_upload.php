<?php
include("session.php");

$api_key    = "a1c3659bf97b2cc89addf54a0b00ffce";
$api_secret = "f82db0f32294efbf";

require_once("phpFlickr.php");
$f = new phpFlickr($api_key, $api_secret);

  $title = $_POST["title"];
  $desc = $_POST["description"];
  $tags = $_POST["tags"];
  $public = $_POST["is_public"];
  if (!$desc) $desc = '';

  $path = $_FILES["photo"]["tmp_name"];

$result = $f->sync_upload($path, $title, $desc, $tags);
echo "Uploaded " . $path;
echo $result;

?>
