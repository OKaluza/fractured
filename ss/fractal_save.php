<?php
  include("session.php");
  include("connect.php");

  /* From: http://blog.kevburnsjr.com/php-unique-hash */
  function base62($int) {
    /* Ascii :                    0  9,         A  Z,         a  z     */
    /* $chars = array_merge(range(48,57), range(65,90), range(97,122)) */
    $chars = array(
      0=>48,1=>49,2=>50,3=>51,4=>52,5=>53,6=>54,7=>55,8=>56,9=>57,10=>65,
      11=>66,12=>67,13=>68,14=>69,15=>70,16=>71,17=>72,18=>73,19=>74,20=>75,
      21=>76,22=>77,23=>78,24=>79,25=>80,26=>81,27=>82,28=>83,29=>84,30=>85,
      31=>86,32=>87,33=>88,34=>89,35=>90,36=>97,37=>98,38=>99,39=>100,40=>101,
      41=>102,42=>103,43=>104,44=>105,45=>106,46=>107,47=>108,48=>109,49=>110,
      50=>111,51=>112,52=>113,53=>114,54=>115,55=>116,56=>117,57=>118,58=>119,
      59=>120,60=>121,61=>122
    );
 
    $key = "";
    while($int > 0) {
      $mod = $int-(floor($int/62)*62);
      $key .= chr($chars[$mod]);
      $int = floor($int/62);
    }
    return strrev($key);
  }

  /* From: http://blog.kevburnsjr.com/php-unique-hash */
  function udihash($num, $len = 5) {
    /* Next prime greater than 62 ^ n / 1.618033988749894848 */
    #$golden_primes = array(1,41,2377,147299,9132313,566201239,35104476161,2176477521929,134941606358731);
    /* Here's another set using the following primes */
    $golden_primes = array(2,43,2381,147311,9132317,566201243,35104476163,2176477521961,13494160635873);
    $ceil = pow(62, $len);
    $prime = $golden_primes[$len];
    $dec = ($num * $prime)-floor($num * $prime/$ceil)*$ceil;
    $hash = base62($dec);
    return str_pad($hash, $len, "0", STR_PAD_LEFT);
  }

  $user = $_SESSION["user_id"];
  $desc = $_POST["description"];
  $public = $_POST["public"];
  $type = $_POST["type"];
  if (!$desc) $desc = '';

  //Allow no logged in user only for sharing image
  if ($user <= 0 && $type != 1) exit();

  //Get submitted details
  //(check magic quotes escaping setting first and strip slashes if any as we are escaping with mysql_real_escape_string anyway)
  if(get_magic_quotes_gpc()) {
    $desc = mysql_real_escape_string(stripslashes($desc));
    $data = stripslashes($_POST["source"]);
    $thumb = stripslashes(base64_decode($_POST["thumbnail"]));
  } else {
    $desc = mysql_real_escape_string($desc);
    $data = $_POST["source"];
    $thumb = base64_decode($_POST["thumbnail"]);
  }
  $data = mysql_real_escape_string($data);

  $mysqldate = date("Y-m-d H:i:s");

  //Insert in loop in case (unlikely) of microtime clash
  for ($count=0; $count<100; $count++) 
  {
    $ftime = microtime(true);
    $inttime = intval($ftime * 1000);
    //Create a 7 digit base62 hash
    //Max = 3579346000000, /1000 = 3579346000 = runs out of digits on Fri, 04 Jun 2083
    //Could change to /100 = 35793460000 = Sat, 02 Apr 3104, but more likely to get time collisions on inserts
    if (isset($_POST['locator']))
      $locator = $_POST['locator'];
    else
      $locator = udihash($inttime, 7);

    $query = "INSERT INTO fractal (locator, user_id, date, name, source, public, type) values('$locator', '$user', '$mysqldate', '$desc', '$data', '$public', '$type');";
    $result = mysql_query($query);
    if ($result == 1) //Loop until insert successful
    {
      if ($type == 0)
      {
        if ($public == 1)
          $filename = "../thumbs/" . $locator . ".jpg";
        else
          $filename = "../thumbs/" . md5($locator) . ".jpg";
        file_put_contents($filename, $thumb);
      }
      break;
    }
    //echo $ftime . "," . $inttime . "," . $locator . "<br>";
    //echo mysql_error();
    usleep(1000);  //Wait for 1 millisecond
  }

  mysql_close();
  $loc = "http://{$_SERVER['SERVER_NAME']}/$locator";
  echo $loc;
  exit();
?>
