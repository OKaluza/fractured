<?php
  include("connect.php");
  include("session.php");

  $type = $_GET["type"];
  $user = $_SESSION["user_id"];
  $thumb = 160; //Thumb size + margin
  $str = "images";
  if ($type == "images" || $type == "myimages")
    $thumb = 100;

  if ($type == "examples")
    $query = "SELECT locator FROM fractal WHERE user_id = -1 ORDER BY date;";
  else if ($type == "shared")
    $query = "SELECT locator FROM fractal WHERE user_id > 0 and public = 1 and type = 0 ORDER BY date DESC;";
  else if ($type == "myshared")
    $query = "SELECT locator FROM fractal WHERE user_id = '$user' and public = 1 and type = 0 ORDER BY date;";
  else if ($type == "myuploads")
    $query = "SELECT locator FROM fractal WHERE user_id = '$user' and public = 0 and type = 0 ORDER BY date;";
  else if ($type == "images")
    $query = "SELECT locator FROM fractal WHERE public = 1 and type = 1 ORDER BY date DESC;";
  else if ($type == "myimages")
    $query = "SELECT locator FROM fractal WHERE user_id = '$user' and type = 1 ORDER BY date;";

  $result = mysql_query( $query );
  if (!$result) die ('Unable to run query:'.mysql_error());
  $totimg = mysql_num_rows($result);
  if ($totimg == 0) exit();
  $links = array();
  while ($row = mysql_fetch_array($result, MYSQL_NUM))
  {
    $links[] = $row[0];
  }

  //Close to free resources
  mysql_close();

  if (isset($_GET['offset']))
    $offset = $_GET['offset'];
  else
    $offset = 0;
  //Wrap around
  if ($offset >= $totimg) $offset %= $totimg;

  //Calculate img/page based on width and height
  $imgpage = 18;  //Images per page
  if (isset($_GET['width']) && isset($_GET['height']))
  {
    $w = floor(($_GET['width']-10) / $thumb);
    $h = floor(($_GET['height']-110) / $thumb);
    $imgpage = $w * $h;
  }

  echo '<ul class="navigation">';

  if ($offset == 0)
    echo '<li class="left"><span>Back</span></li>';
  else
    echo '<li class="left"><a href="javascript:loadGallery(' . ($offset - $imgpage) . ');">Back</a></li>';
  
  if ($offset + $imgpage >= $totimg)
    echo '<li class="left"><span>Next</span></li>';
  else
    echo '<li class="left"><a href="javascript:loadGallery(' . ($offset + $imgpage) . ');">Next</a></li>';

  echo '</ul>';

  if ($type == "shared" || $type == "images")
    echo "<a href='/ss/rss.php?type=$type'><img src='media/rss.png'></a>";

  //Display page jump links
  echo '<div class="ginfo">';
  if ($totimg > $imgpage)
  {
    echo 'Page: ';
    $page = 0;
    for ($i = 1; $i <= $totimg; $i += $imgpage)
    {
      $pageoffset = $page * $imgpage;
      $page++;
      if ($pageoffset == $offset)
        echo "<a>$page</a>\n";
      else
        echo '<a href="javascript:loadGallery(' . $pageoffset . ');">' . $page . "</a>\n";
    }
  }
  echo ' ... Displaying images ';
  $last = $offset + $imgpage;
  if ($last > $totimg) {$last = $totimg;}
  echo $offset + 1 . " to $last  of $totimg"; 
  echo '</div>';


  for($x=$offset; $x < $offset + $imgpage; $x++)
  {
    if ($x == $totimg) break;
    if ($thumb == 100)
    {
      $url = 'http://imgur.com/' . $links[$x] . '.jpg';
      $filename = 'http://imgur.com/' . $links[$x] . 's.jpg';
    }
    else 
    {
      $filename = "/thumbs/" . $links[$x] . ".jpg";
      $url = '/' . $links[$x];
      if (!file_exists(".." . $filename))
        $filename = "/thumbs/" . md5($links[$x]) . ".jpg";
    }
    echo '<div class="float">';
    echo '<a href="'.$url.'">';
	  echo '<img src="' . $filename . '" /></a>';
    echo "</a></div>\n";
  }
?>

