<?php
  session_start();

  include("connect.php");

  $locator =$_GET['id'];

  $query = "SELECT * FROM fractal WHERE locator = '$locator';";
  $result = mysql_query( $query );
  if( mysql_num_rows( $result ))
  {
    $row = mysql_fetch_assoc($result);
    //Return the first row result JSON (should only be one)
    echo $row["name"] . "\n";
    echo $row["source"];
  }

  //Close to free resources
  mysql_close();

/*
  echo "<script language='javascript'>";
  echo "localStorage['fractured.name'] = " . $row["name"] . ";";
  echo "localStorage['fractured.active'] = " . $row["source"] . ";";
  echo "window.location = '/'";
  echo "</script>";
*/
  exit();
?>


