<?php
  session_start();
  include("connect.php");

  $user = $_SESSION["user_id"];
  $session = $_GET['id'];
  $goto = $_SERVER['HTTP_REFERER'];

  if (isset($session))
  {
    $query = sprintf("DELETE FROM session WHERE id = '$session';");
    //echo $query;
    mysql_query($query);
  }

  mysql_close();

  exit();
?>
