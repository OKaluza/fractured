<?php
  include("session.php");
  include("connect.php");

  //Always filter by session user id, so can't access another users data with GET url alone
  $user = $_SESSION["user_id"];

  //Check the user agent, when changes the session is invalidated
  //(Helps protect against session hijack)
  if ($_SESSION['useragent'] != $_SERVER['HTTP_USER_AGENT'])
  {
    $user = $_SESSION["user_id"] = 0;
    session_destroy();
  }

  //Some browser info
  if (isset($_GET['info']))
    $_SESSION["info"] = $_GET['info'];

  if ($user > 0)
  {
    //Retrieve specific ID or list?
    if (isset($_GET['id']))
    {
      $query = "SELECT * FROM session WHERE user_id = '$user' AND id = '{$_GET['id']}';";
      $result = $mysql->query($query);
      if( $result->num_rows)
      {
        $row = $result->fetch_assoc();
        $data = $row["data"];
        //Return the first row result JSON (should only be one)
        // serve it as javascript
        header("Content-Type: application/json");
        // you don't want it reloading the js every time because the
        // auto generated content always has a new date stamp
        //header("Cache-Control: max-age=604800");
        //header("Last-Modified: Mon, 22 Oct 2012 00:00:00 GMT");
        $size = $row["size"];
        //Temporary fix for empty size:
        if ($size == 0 && $data[0] != '{') {$data = gzinflate($data); $size = strlen($data);}
        header("Content-Length: ".$size); //set header length - original size
        //Gzipped?
        if ($data[0] != '{')
        {
          if (stripos($_SERVER["HTTP_ACCEPT_ENCODING"], 'gzip') !== false)
            header('Content-Encoding: gzip');
          else
            // client does not accept gzipped data
            //Need to strip header because we used gzencode()
            $data = gzinflate(substr($data,10,-8));
        }
          
        echo $data;
      }
    } else {
      $query = "SELECT * FROM session WHERE user_id = '$user';";
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
  $mysql->close();
  
  exit();
?>


