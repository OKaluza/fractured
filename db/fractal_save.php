<?php
  session_start();
  include("connect.php");

  $user = $_SESSION["user_id"];
  $goto = $_SERVER['HTTP_REFERER'];
  $desc = $_POST["description"];
  $public = $_POST["public"];
  if (!$desc) $desc = '';

  //Get submitted details
  //(check magic quotes escaping setting first and strip slashes if any as we are escaping with mysql_real_escape_string anyway)
  if(get_magic_quotes_gpc()) {
    $desc = mysql_real_escape_string(stripslashes($desc));
    $data = stripslashes($_POST["source"]);
    $thumb = stripslashes(base64_decode($_POST["thumbnail"]));
  } else {
    $desc = mysql_real_escape_string($desc);
    $data = $_POST["source"];
    $thumb = base64_decode($_POST["thumbnail"]);
  }
    //header('Content-type: image/jpeg');
    //echo $thumb;
  $data = mysql_real_escape_string($data);
  $thumb = mysql_real_escape_string($thumb);
  $mysqldate = date("Y-m-d H:i:s");

  //Insert in loop in case (unlikely) of microtime clash
  for ($count=0; $count<100; $count++) 
  {
    $ftime = microtime(true);
    //base64_encode made url safe
    $locator = rtrim(strtr(base64_encode(pack("d", $ftime)), '+/', '-_'), '=');

    $query = "INSERT INTO fractal (locator, user_id, date, name, source, public, preview) values('$locator', '$user', '$mysqldate', '$desc', '$data', '$public', '$thumb');";
    $result = mysql_query($query);
    if ($result == 1) //Loop until insert successful
      break;
    echo mysql_error();
  }

  mysql_close();
  $loc =  $goto . "#" . $locator;
  header("Location: {$loc}");
  exit();
?>
