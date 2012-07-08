<?php
  include("session.php");
  //Kill the session
  $_SESSION['user_id'] = 0;
  session_destroy();
?>
