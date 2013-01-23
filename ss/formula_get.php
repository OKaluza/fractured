<?php
  include("session.php");
  include("connect.php");

  //Always filter by session user id, so can't access another users data with GET url alone
  $user = $_SESSION["user_id"];
  $formulae = $_GET['id'];

  //Retrieve specific ID or list?
  if (isset($formulae))
  {
    $query = "SELECT * FROM formula WHERE (public = 1 OR user_id = '$user') AND id = '$formulae';";
    $result = $mysql->query( $query );
    if ($result->num_rows)
    {
      $row = $result->fetch_assoc();
      //Return the first row result JSON (should only be one)
      echo $row["data"];
    }
  }
  else
  {
    $query = "SELECT * FROM formula WHERE public = 1 OR user_id = '$user';";
    $result = $mysql->query( $query );
    // Fetch each row of the results into array $row
    echo '[';
    $count = 0;
    while ($row = $result->fetch_array())
    {
      if ($count > 0) echo ',';
      $count++;
      $datetime = strtotime($row["date"]);
      $mysqldate = date("Y/m/d", $datetime);
      echo '{"id": "'. $row["id"] . '",';
      echo ' "public": "'. $row["public"] . '",';
      echo ' "date": "'. $mysqldate . '",';
      echo ' "name": "'. $row["name"] . '"}';
    }
    echo ']';
  }

  //Close to free resources
  $mysql->close();
  
  exit();
?>


