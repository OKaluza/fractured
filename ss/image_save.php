<?php
  include("session.php");
  include("connect.php");

  $url = $_POST["url"];
  $user = $_SESSION["user_id"];
  $desc = $_POST["description"];
  $info = $_POST["info"];
  if (!$desc) $desc = '';
  $thumb = $_POST["thumbnail"];

  //Get submitted details
  //(check magic quotes escaping setting first and strip slashes if any as we are escaping with real_escape_string anyway)
  if(get_magic_quotes_gpc()) {
    $desc = $mysql->real_escape_string(stripslashes($desc));
    $info = $mysql->real_escape_string(stripslashes($info));
    $url = $mysql->real_escape_string(stripslashes($url));
    $thumb = stripslashes($thumb);
  } else {
    $desc = $mysql->real_escape_string($desc);
    $info = $mysql->real_escape_string($info);
    $url = $mysql->real_escape_string($url);
  }

  $mysqldate = date("Y-m-d H:i:s");

  $query = "INSERT INTO image (url, user_id, date, name, thumb, info) values('$url', '$user', '$mysqldate', '$desc', '$thumb', '$info');";

  $result = $mysql->query($query);
  if (!$result) die('Invalid query: ' . $mysql->error());
  $mysql->close();

  exit();
?>
