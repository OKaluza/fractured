<?php
  session_start();

  include("connect.php");

  //Always filter by session user id, so can't access another users data with GET url alone
  $user = $_SESSION["user_id"];
  $session = $_GET['id'];
  $set = $_GET['setid'];
  if ($set)
  {
    //Simply set passed id in session variable and return
    $_SESSION['session_id'] = $set;
    exit();
  }

  //Retrieve specific ID or list?
  if (isset($session))
  {
    $query = "SELECT * FROM session WHERE user_id = '$user' AND id = '$session';";
    $result = mysql_query( $query );
    if( mysql_num_rows( $result ))
    {
      $row = mysql_fetch_assoc($result);
      //Return the first row result JSON (should only be one)
      if ($row["data"][0] == '{')
        echo $row["data"];
      else
        echo gzinflate($row["data"]);
      //exit();
      //Update current session id
      $_SESSION['session_id'] = $session;
    }
  }
  else
  {
    $query = "SELECT * FROM session WHERE user_id = '$user';";
    $result = mysql_query( $query );
    // Fetch each row of the results into array $row
    echo '[';
    $count = 0;
    while ($row = mysql_fetch_array($result))
    {
      if ($count > 0) echo ',';
      $count++;
      echo '{"id": "'. $row["id"] . '",';
      echo ' "date": "'. $row["date"] . '",';
      echo ' "description": "'. $row["description"] . '"}';
    }
    echo ']';
  }

  //Close to free resources
  mysql_close();
  
  exit();
?>


