<?php
  session_start();

  include("connect.php");

  $user = $_GET['user'];
  $login = $_GET['login'];
  $hash = hash('sha256', $login);

    $query = "SELECT * FROM login WHERE user_id = '$user' AND hash = '$hash';";
    $result = mysql_query($query);
    if (mysql_num_rows($result))
    {
      //Found a saved login, lookup the user details
        $query = "SELECT * FROM user WHERE id = '$user';";
        $result = mysql_query($query);
        if (mysql_num_rows($result))
        {
          $row = mysql_fetch_assoc($result);
          $_SESSION['user_id'] = $row["id"];
          $_SESSION['name'] = $row["name"];
          $_SESSION['email'] = $row["email"];
          $openid = $row["openid"];
             $_SESSION['login'] = $login;

          //JSON response
          echo '{"id" : "' . $login . '", "user" : "' . $user . '"}';

          //Delete old entry
          $query = "DELETE FROM login WHERE user_id = '$user' AND hash = '$hash';";
          mysql_query($query);

          //Create a new login entry
          include("login_new.php");
        }
    }

  //Close to free resources
  mysql_close();
  exit();
?>


