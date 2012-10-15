<?php
include("session.php");

$api_key    = "a1c3659bf97b2cc89addf54a0b00ffce";
$api_secret = "f82db0f32294efbf";

require_once("phpFlickr.php");
$f = new phpFlickr($api_key, $api_secret);

if (isset($_GET['test']))
{
  $username = "null";
  $id = "null";
  if ($_SESSION['OauthToken'])
  {
    $f->setOauthToken($_SESSION['OauthToken'], $_SESSION['OauthSecretToken']);
    $res = $f->test_login();
    $username = '"' . $res['username'] . '"';
    $id = '"' . $res['id'] . '"';
  }
  echo '{"id" : ' . $id . ', "username" : ' . $username . '}';
}
else if (isset($_GET['auth']))
{
  $f->getRequestToken("http://fractured.ozone.id.au/ss/flickr.php", "write"); 
}
else if (isset($_GET['logout']))
{
  unset($_SESSION['OauthToken']);
  unset($_SESSION['OauthSecretToken']);
  echo "Token cleared";
}
else if (isset($_GET['upload']))
{
  $f->setOauthToken($_SESSION['OauthToken'], $_SESSION['OauthSecretToken']);
  $title = $_POST["title"];
  $desc = $_POST["description"];
  $tags = $_POST["tags"];
  $public = $_POST["public"];
  $friend = $_POST["friend"];
  $family = $_POST["family"];
  if (!$desc) $desc = '';

  $path = $_FILES["photo"]["tmp_name"];

  $id = $f->sync_upload($path, $title, $desc, $tags, $public, $friend, $family);
  $info = $f->call('flickr.photos.getInfo', array('photo_id' => $id));
  //echo var_export($info);
  echo '{"id" : "' . $id . '"';
  echo ', "nsid" : "' . $info['photo']['owner']['nsid'] . '"';
  echo ', "farm" : "' . $info['photo']['farm'] . '"';
  echo ', "server" : "' . $info['photo']['server'] . '"';
  echo ', "secret" : "' . $info['photo']['secret'] . '"';
  echo ', "url" : "http://www.flickr.com/photos/' . "{$info['photo']['owner']['nsid']}/$id/" . '"';
  echo ', "thumb" : "http://farm' . "{$info['photo']['farm']}.staticflickr.com/{$info['photo']['server']}/{$id}_{$info['photo']['secret']}_t.jpg";
  echo '"}';
  //echo $id;
}
elseif (isset($_GET['oauth_token']))
{
  //echo "Access token: " . $_GET['oauth_token'];
  if (!$f->getAccessToken())
    echo "FAILED";
  else
  {
    $_SESSION['OauthToken'] = $f->getOauthToken();  
    $_SESSION['OauthSecretToken'] = $f->getOauthSecretToken(); 
    //echo "Authenticated: $OauthToken $OauthSecretToken";
  }
  header('Location: /');
}
else
  echo "Something went wrong?"
?>
