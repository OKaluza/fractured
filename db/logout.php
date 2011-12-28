<?php
  session_start(); 

  include("connect.php");

  $user = $_SESSION['user_id'];
  $login = $_SESSION['login'];

  //Delete old entry
  $query = "DELETE FROM login WHERE user_id = '$user' AND hash = '$login';";
  mysql_query($query);

  mysql_close();

  //Kill the session
  session_destroy();
?>
