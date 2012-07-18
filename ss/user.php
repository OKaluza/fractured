<?php
  include("session.php");
  include("connect.php");

  //A user has used an OpenID to log in,
  //Look them up in the database, if not found, insert a new user record
  //then save details to session and create a new login record
  //finally redirect logged in user back to home page

  $openid = $_SESSION["identity"];
  $email = $_SESSION["email"];
  $name = $_SESSION["name"];
  if (!isset($name))
    $name = strtok($email, "@");

  if (!isset($openid))
  { //Should not be possible if session set correctly
    echo "<br>Error, no openid specified!<br>" . session_id();
    exit();
  }

  //write the SQL statement and save it into a variable
  $query = "SELECT * FROM user WHERE openid = '$openid';";

  //query the database and save it into a variable
  $result = mysql_query( $query );
  
  if( mysql_num_rows( $result ))
  {
    $row = mysql_fetch_assoc($result);
    $_SESSION['user_id'] = $row["id"];
    $_SESSION['name'] = $row["name"];
    $_SESSION['email'] = $row["email"];
    //echo "Logged in, user found in db";
  }
  else
  {
    //Insert new user record
    $query = "INSERT INTO user (openid, name, email) 
                VALUES ('$openid', '$name', '$email');";
    $result = mysql_query($query);
    //Once new user inserted, save id
    if ($result == 1)
      $_SESSION['user_id'] = mysql_insert_id();
    else
      $_SESSION['error'] = "Database error";
  }

  //Save the user agent, when changes the session is invalidated
  //(Helps protect against session hijack)
  $_SESSION['useragent'] = $_SERVER['HTTP_USER_AGENT'];

  //Close to free resources
  mysql_close();

  header("Location: /");
  
  exit();
?>


