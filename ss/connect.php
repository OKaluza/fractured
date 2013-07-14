<?php	
	//Make a connection to the database server
  $hostname = "localhost";
  $username = "ozone_user";
  $password = "resu!234";
  $dbname = "ozone_main";

  try
  {
    $db = new PDO("mysql:host=$hostname;dbname=$dbname", $username, $password);
    //$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
  }
  catch(PDOException $e)
  {
    echo $e->getMessage();
  }
?>
