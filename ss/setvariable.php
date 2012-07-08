<?php
  include("session.php");

  $name = $_GET['name'];

  //Allowed to set?
  switch ($name)
  {
    case "session_id":
      break;
    default:
      exit();
  }

  //Simply set passed value in session variable and return
  $_SESSION[$name] = $_GET['value'];
?>


