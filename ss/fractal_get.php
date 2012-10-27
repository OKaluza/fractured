<?php
  include("session.php");
  include("connect.php");

  $query = "SELECT * FROM fractal WHERE locator = '{$_GET['id']}';";
  $result = mysql_query( $query );
  if( mysql_num_rows( $result ))
  {
    $row = mysql_fetch_assoc($result);
    //Return the first row result JSON (should only be one)
    echo $row["name"] . "\n" . $row["source"];
  }

  //Close to free resources
  mysql_close();

  exit();
?>


