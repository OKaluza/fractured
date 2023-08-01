<?php
  include("session.php");
  include("connect.php");

  //A user has used an OpenID to log in,
  //Look them up in the database, if not found, insert a new user record
  //then save details to session and create a new login record
  //finally redirect logged in user back to home page

  $openid = $_SESSION["identity"];
  if (!isset($openid))
  { //Should not be possible if session set correctly
    echo "<br>Error, no openid specified!<br>" . session_id();
    exit();
  }

  $query = $db->prepare("SELECT * FROM user WHERE openid = :id");
  if ($query->execute(array(':id' => $openid)) && $query->rowCount())
  {
    $row = $query->fetch(PDO::FETCH_ASSOC);
    $_SESSION['user_id'] = $row["id"];
    $_SESSION['name'] = $row["name"];
    $_SESSION['email'] = $row["email"];
    //echo "Logged in, user found in db";
  }
  else
  {
    //Insert new user record
    $query = $db->prepare("INSERT INTO user (openid, name, email) VALUES (:openid, :name, :email)");
    $query->BindValue(':openid', $openid);
    $query->BindValue(':name', isset($_SESSION["name"]) ? $_SESSION["name"] : strtok($email_, "@"));
    $query->BindValue(':email', $_SESSION["email"]);
    //Once new user inserted, save id
    if ($query->execute() && $query->rowCount() == 1)
      $_SESSION['user_id'] = $db->lastInsertId();
    else
      $_SESSION['error'] = "Database error";
  }

  //Save the user agent, when changes the session is invalidated
  //(Helps protect against session hijack)
  $_SESSION['useragent'] = $_SERVER['HTTP_USER_AGENT'];

  //Close to free resources
  $query->closeCursor();
  $db = null;

  header("Location: /");
  
  exit();
?>


