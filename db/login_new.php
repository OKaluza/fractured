<?php
  //User has logged in, included from user.php and login_get.php
  //Create a login record and insert into database (stored in localstorage or cookie?)
  //(TODO: clean these up when older than 3 months)
  $mysqldate = date("Y-m-d H:i:s");
  $id = $_SESSION['user_id'];
  $login = hash('sha256', $openid . mt_rand());  //Generate unique login string
  $query = "INSERT INTO login (user_id, date, hash) 
            VALUES ('$id', '$mysqldate', '$login');";
  $result = mysql_query($query);
  if ($result == 1)
    $_SESSION['login'] = $login;
  else
    $_SESSION['error'] = "Database error";
?>
