<?php
  include("session.php");
  include("connect.php");

  try
  {
    $query = $db->prepare("DELETE FROM formula WHERE id = :id AND user_id = :user");
    $query->execute(array(':id' => $_GET['id'], ':user' => $_SESSION["user_id"]));
    $query->closeCursor();
  }
  catch(PDOException $e)
  {
    echo $e->getMessage();
  }

  $db = null;

  exit();
?>
