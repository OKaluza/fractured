<?php
  include("session.php");
  include("connect.php");

  $user = $_SESSION["user_id"];
  $session = $_GET['id'];

  if (isset($session))
  {
    $query = sprintf("DELETE FROM session WHERE id = '$session' AND user_id = '$user';");
    //echo $query;
    $result = $mysql->query($query);
    if (!$result) die('Invalid query: ' . $mysql->error());
  }

  $mysql->close();

  exit();
?>
