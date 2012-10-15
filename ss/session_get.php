<?php
  include("session.php");
  include("connect.php");

  //Always filter by session user id, so can't access another users data with GET url alone
  $user = $_SESSION["user_id"];
  $session = $_GET['id'];

  //Check the user agent, when changes the session is invalidated
  //(Helps protect against session hijack)
  if ($_SESSION['useragent'] != $_SERVER['HTTP_USER_AGENT'])
  {
    $user = $_SESSION["user_id"] = 0;
    session_destroy();
  }

  if ($user > 0)
  {
    //Retrieve specific ID or list?
    if (isset($session))
    {
      $query = "SELECT * FROM session WHERE user_id = '$user' AND id = '$session';";
      $result = mysql_query( $query );
      if( mysql_num_rows( $result ))
      {
        $row = mysql_fetch_assoc($result);
        $data = $row["data"];
        //Return the first row result JSON (should only be one)
        if ($data[0] != '{')
          $data = gzinflate($data);
        header("Content-Length: ".strlen($data)); //set header length
        echo $data;
      }
    } else {
      $query = "SELECT * FROM session WHERE user_id = '$user';";
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
        echo ' "description": "'. $row["description"] . '"}';
      }
      echo ']';
    }
  }
  else
  {
    /* No session */
    echo '!No session';
    exit();
  }

  //Close to free resources
  mysql_close();
  
  exit();
?>


