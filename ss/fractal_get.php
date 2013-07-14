<?php
  include("session.php");
  include("connect.php");

  $query = $db->prepare("SELECT * FROM fractal WHERE locator = :id");
  if ($query->execute(array(':id' => $_GET['id'])) && $query->rowCount())
  {
    $row = $query->fetch(PDO::FETCH_ASSOC);
    //Return the first row result JSON (should only be one)
    echo $row["name"] . "\n" . $row["source"];
  }

  //Close to free resources
  $query->closeCursor();
  $db = null;
?>


