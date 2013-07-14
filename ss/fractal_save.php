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

  function writeThumb($public, $locator, $thumb)
  {
    if ($public == 1)
      $filename = "../thumbs/" . $locator . ".jpg";
    else
      $filename = "../thumbs/" . md5($locator) . ".jpg";
    file_put_contents($filename, $thumb);
  }

  $user = $_SESSION["user_id"];

  //Allow no logged in user only
  if ($user <= 0) exit();

  $thumb = base64_decode($_POST["thumbnail"]);
  $public = isset($_POST["public"]) ? $_POST["public"] : 0;
  $query;

  //Insert in loop in case (unlikely) of microtime clash
  for ($count=0; $count<100; $count++) 
  {
    $ftime = microtime(true);
    $inttime = intval($ftime * 1000);
    //Create a 7 digit base62 hash
    //Max = 3579346000000, /1000 = 3579346000 = runs out of digits on Fri, 04 Jun 2083
    //Could change to /100 = 35793460000 = Sat, 02 Apr 3104, but more likely to get time collisions on inserts
    $locator = $_POST['locator'];
    if (!isset($locator))
      $locator = udihash($inttime, 7);

    $params = array(
      ':locator' => $locator,
      ':user' => $user,
      ':date' => date("Y-m-d H:i:s"),
      ':name' => $_POST["description"],
      ':source' => $_POST["source"],
      ':public' => $public
      );

    $query = $db->prepare("INSERT INTO fractal (locator, user_id, date, name, source, public) values(:locator, :user, :date, :name, :source, :public)");
    if ($query->execute($params) && $query->rowCount()) //Loop until insert successful
    {
      writeThumb($public, $locator, $thumb);
      break;
    }
    else if (isset($_POST['locator']))
    {
      //Update allowed if locator set and user_id matches
      $query = $db->prepare("UPDATE fractal SET date = :date, name = :name, source = :source, public = :public WHERE locator = :locator AND user_id = :user");
      if (!$query->execute($params) || $query->rowCount() < 1) {
        echo "Update failed, is this your fractal?";
        exit();
      }
      writeThumb($public, $locator, $thumb);
      break;
    }
    //echo $ftime . "," . $inttime . "," . $locator . "<br>";
    usleep(1000);  //Wait for 1 millisecond
  }

  $query->closeCursor();
  $db = null;
  $loc = "http://{$_SERVER['SERVER_NAME']}/$locator";
  echo $loc;
  exit();
?>
