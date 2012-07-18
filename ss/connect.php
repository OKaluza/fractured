<?php	
	$host = 'localhost';
	$username = 'ozone_user';
	$password = 'resu';
	$db = 'ozone_main';
	
	//Make a connection to the database server
	mysql_connect($host, $username, $password) OR
	    die("Could Not Connect to Database");
	
	//Select database to use
	mysql_select_db($db) or die("Failed Selecting DB");
?>
