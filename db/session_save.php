<?php
  session_start();
  include("connect.php");

  $user = $_SESSION["user_id"];
  //$sessid = $_SESSION["session_id"];
  $sessid = $_POST["session_id"];
  $goto = $_SERVER['HTTP_REFERER'];
  $desc = $_POST["description"];
  if (!$desc) $desc = '';

    //Get submitted comment details
    //(check magic quotes escaping setting first and strip slashes if any as we are escaping with mysql_real_escape_string anyway)
    if(get_magic_quotes_gpc()) {
      $desc = mysql_real_escape_string(stripslashes($desc));
      $data = stripslashes($_POST["data"]);
    } else {
      $desc = mysql_real_escape_string($desc);
      $data = $_POST["data"];
    }
    $mysqldate = date("Y-m-d H:i:s");

    //Compress session text
    if (strlen($data) > 1000)
      $data = addslashes(gzdeflate($data, 9));
    else
      $data = mysql_real_escape_string($data);

    if (!$sessid)
    {
      $query = "INSERT INTO session (user_id, date, description, data) values('$user', '$mysqldate', '$desc', '$data');";
      $result = mysql_query($query);

      if ($result == 1)
        //New session inserted, save id
        $_SESSION['session_id'] = mysql_insert_id();
      else
        $_SESSION['error'] = "Database error";
    }
    else
    {
      $query = "UPDATE session SET data = '$data' WHERE id = '$sessid';";
      mysql_query($query);
    }
//echo $query;

    mysql_close();
    header("Location: {$goto}");
  exit();
?>
