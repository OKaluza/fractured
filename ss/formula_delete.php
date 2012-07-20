<?php
  include("session.php");
  include("connect.php");

  $user = $_SESSION["user_id"];
  $fid = $_GET['id'];

  if (isset($fid))
  {
    $query = sprintf("DELETE FROM formula WHERE id = '$fid' AND user_id = '$user';");
    //echo $query;
    $result = mysql_query($query);
    if (!$result) die('Invalid query: ' . mysql_error());
  }

  mysql_close();

  exit();
?>
