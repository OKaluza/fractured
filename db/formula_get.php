<?php
  session_start();
  include("connect.php");

  //Always filter by session user id, so can't access another users data with GET url alone
  $user = $_SESSION["user_id"];
  $formulae = $_GET['id'];
  $public = $_GET['public'];

  //Retrieve specific ID or list?
  if (isset($formulae))
  {
    $query = "SELECT * FROM formula WHERE user_id = '$user' AND id = '$formulae';";
    $result = mysql_query( $query );
    if( mysql_num_rows( $result ))
    {
      $row = mysql_fetch_assoc($result);
      //Return the first row result JSON (should only be one)
      echo $row["data"];
    }
  }
  else
  {
    if ($public == 1)
      $query = "SELECT * FROM formula WHERE public = 1";
    else
      $query = "SELECT * FROM formula WHERE user_id = '$user';";
    $result = mysql_query( $query );
    // Fetch each row of the results into array $row
    echo '[';
    $count = 0;
    while ($row = mysql_fetch_array($result))
    {
      if ($count > 0) echo ',';
      $count++;
      $datetime = strtotime($row["date"]);
      $mysqldate = date("Y/m/d", $datetime);
      echo '{"id": "'. $row["id"] . '",';
      echo ' "date": "'. $mysqldate . '",';
      echo ' "name": "'. $row["name"] . '"}';
    }
    echo ']';
  }

  //Close to free resources
  mysql_close();
  
  exit();
?>


