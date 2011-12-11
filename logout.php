<?php
  session_start(); 

  include("connect.php");

  $user = $_SESSION['user_id'];
  $login = $_SESSION['login'];
  $hash = hash('sha256', $login);

  //Delete old entry
  $query = "DELETE FROM login WHERE user_id = '$user' AND hash = '$hash';";
  mysql_query($query);

  mysql_close();

  session_destroy();
  header("Location: /");	
?>
