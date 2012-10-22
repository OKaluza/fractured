<?php
  include("session.php");
  include("connect.php");

  $user = $_SESSION["user_id"];
  $sessid = $_POST["session_id"];
  $goto = $_SERVER['HTTP_REFERER'];
  $desc = $_POST["description"];
  if (!$desc) $desc = '';

  if ($user <= 0) {
    header("Location: {$goto}");
    exit();
  }

  //(check magic quotes escaping setting first and strip slashes if any as we are escaping with mysql_real_escape_string anyway)
  if(get_magic_quotes_gpc()) {
    $desc = mysql_real_escape_string(stripslashes($desc));
    $data = stripslashes($_POST["data"]);
  } else {
    $desc = mysql_real_escape_string($desc);
    $data = $_POST["data"];
  }
  $mysqldate = date("Y-m-d H:i:s");

  //Compress session text
  $size = strlen($data);
  if (size > 1000)
    $data = addslashes(gzencode($data, 9));
  else
    $data = mysql_real_escape_string($data);

  if (!$sessid)
  {
    $query = "INSERT INTO session (user_id, date, description, data, size) values('$user', '$mysqldate', '$desc', '$data', '$size');";
    $result = mysql_query($query);

    if (!$result) die('Invalid query: ' . mysql_error());

    //New session inserted, save id
    $sessid = mysql_insert_id();
  }
  else
  {
    $query = "UPDATE session SET date = '$mysqldate', data = '$data', size = '$size' WHERE id = '$sessid' AND user_id = '$user';";
    $result = mysql_query($query);
    if (!$result) die('Invalid query: ' . mysql_error());
  }
//echo $query;

  mysql_close();
  echo $sessid;
  exit();
?>
