<?php
  session_start();

  //JSON response: login session variables
  if ($_SESSION['login']) {
    echo '{"id" : "' . $_SESSION['login'] . '", "user" : "' . $_SESSION['user_id'] . '"}';
  } else {
    //Generate a random once off session code #, save time for expiry
    $_SESSION['code'] = mt_rand();
    $_SESSION['time'] = time();
    echo '{"id" : "", "user" : "0", "code" : "' . $_SESSION['code'] . '"}';
  }
?>
