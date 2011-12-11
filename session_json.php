<?php
  session_start();

  //JSON response: login session variables
  if ($_SESSION['login'])
    echo '{"id" : "' . $_SESSION['login'] . '", "user" : "' . $_SESSION['user_id'] . '"}';
  else
    echo '{"id" : "", "user" : "0"}';
?>
