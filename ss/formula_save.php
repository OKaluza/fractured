<?php
  include("session.php");
  include("connect.php");

  $user = $_SESSION["user_id"];
  $name = $_POST["name"];
  $public = $_POST["public"];
  $fid = $_POST["formulae"];

  if (!$desc) $desc = '';

  if ($user <= 0) exit();

  //Get submitted details
  //(check magic quotes escaping setting first and strip slashes if any as we are escaping with mysql_real_escape_string anyway)
  if(get_magic_quotes_gpc()) {
    $name = mysql_real_escape_string(stripslashes($name));
    $data = stripslashes($_POST["data"]);
  } else {
    $name = mysql_real_escape_string($name);
    $data = $_POST["data"];
  }
  $data = mysql_real_escape_string($data);
  $mysqldate = date("Y-m-d H:i:s");

  if (!$fid)
  {
    $query = "INSERT INTO formula (user_id, date, name, data, public) values('$user', '$mysqldate', '$name', '$data', '$public');";
    $result = mysql_query($query);

    if (!$result) die('Invalid query: ' . mysql_error());

    //New session inserted, save id
    $fid = mysql_insert_id();
  }
  else
  {
    $query = "UPDATE formula SET data = '$data' WHERE id = '$fid' AND user_id = '$user';";
    $result = mysql_query($query);
    if (!$result) die('Invalid query: ' . mysql_error());
  }
//echo $query;

  mysql_close();
  echo $fid;
?>