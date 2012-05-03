<?php
  session_start();
  include("connect.php");

  $user = $_SESSION["user_id"];
  $goto = $_SERVER['HTTP_REFERER'];
  $name = $_POST["name"];
  $public = $_POST["public"];
  if (!$desc) $desc = '';

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

  $query = "INSERT INTO formula (user_id, date, name, data, public) values('$user', '$mysqldate', '$name', '$data', '$public');";
  $result = mysql_query($query);
        echo $query;
  //echo mysql_error();

  mysql_close();
  //header("Location: {$goto}");
  exit();
?>
