<?php
  session_start();

  $user = $_POST['user'];
  $hash = $_POST['hash'];

  //Once off challenge code, get then clear
  if (time() - $_SESSION['time'] > 30) exit();  //Expired code! (Shouldn't happen)
  $code = $_SESSION['code'];
  unset($_SESSION['code']);

  include("connect.php");

  //Load all this user's login entries
  $query = "SELECT * FROM user,login WHERE user_id = '$user'";
  $result = mysql_query($query);
  while ($row = mysql_fetch_array($result))
  {
    //Found a saved login, check the hash
    //Re-hashed using once-off code
    if ($hash == hash('sha256', $row["hash"] . $code))
    {
      $_SESSION['user_id'] = $user;
      $_SESSION['name'] = $row["name"];
      $_SESSION['email'] = $row["email"];
      $openid = $row["openid"];

      //Delete old entry
      $oldhash = $row["hash"];
      $query = "DELETE FROM login WHERE user_id = '$user' AND hash = '$oldhash';";
      mysql_query($query);

      //Create a new login entry
      include("login_new.php");

      //JSON response
      $json = '{"id" : "' . $login . '", "user" : "' . $user . '"}';
      break;
    }
  }

  if (!isset($json))
  {
    // Attempt to use expired login?
    // Delete all logins for this user to force re-auth
    $query = "DELETE FROM login WHERE user_id = '$user';";
    mysql_query($query);
    $json = '{"id" : "", "user" : "0"}';
  }

  //Return result
  echo $json;

  //Close to free resources
  mysql_close();
  exit();
?>


