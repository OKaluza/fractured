<?php	
	//Make a connection to the database server
  $mysql = new mysqli("localhost", "ozone_user", "resu", "ozone_main");

  if ($mysql->connect_error)
    die('mysqli connect failed: ' . $mysql->connect_error);
?>
