<?php
  include("session.php");
  include("connect.php");

  $query = $db->prepare("INSERT INTO image (url, user_id, date, name, thumb, info) values(:url, :user, :date, :name, :thumb, :info)");
  $query->BindValue(':url', $_POST["url"]);
  $query->BindValue(':user', $_SESSION["user_id"]);
  $query->BindValue(':date', date("Y-m-d H:i:s"));
  $query->BindValue(':name', $_POST["description"]);
  $query->BindValue(':thumb', $_POST["thumbnail"]);
  $query->BindValue(':info', $_POST["info"]);
  if (!$query->execute())
    die('Invalid query');

  $query->closeCursor();
  $db = null;
  exit();
?>
