<?php
  include("session.php");
  include("connect.php");

  $query = "SELECT * FROM fractal WHERE locator = '{$_GET['id']}';";
  $result = $mysql->query( $query );
  if( $result->num_rows)
  {
    $row = $result->fetch_assoc();
    //Return the first row result JSON (should only be one)
    echo $row["name"] . "\n" . $row["source"];
  }

  //Close to free resources
  $mysql->close();

  exit();
?>


