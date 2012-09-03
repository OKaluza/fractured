<?php
  include("connect.php");
  include("session.php");
?>

<?php
  $query = "SELECT * FROM fractal ORDER BY date DESC;";
  //$query = "SELECT * FROM fractal WHERE public < 2;";
  //$query = "SELECT * FROM fractal WHERE user_id = '$user';";
  $result = mysql_query( $query );
  // Fetch each row of the results into array $row
  $totimg = 0;
  while ($row = mysql_fetch_array($result))
  {
    $pics[$totimg] = $row['preview'];
    $links[$totimg] = $row['locator'];
    $public[$totimg] = $row['public'];
    $totimg++;
  }

  //Close to free resources
  mysql_close();


?>

<h1>Gallery</h1>
  
<?php
  if (isset($_GET['offset']))
    $offset = $_GET['offset'];
  else
    $offset = 0;
  //Wrap around
  if ($offset >= $totimg) $offset %= $totimg;

  //Calculate img/page based on width and height
  if (isset($_GET['width']) && isset($_GET['height']))
  {
    $thumb = 160; //Thumb size + margin
    $w = floor(($_GET['width']-10) / $thumb);
    $h = floor(($_GET['height']-50) / $thumb);
    $imgpage = $w * $h;
  }
  else
    $imgpage = 18;  //Images per page

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

  //Display page jump links
  echo '<div class="ginfo">';
  if ($totimg > $imgpage)
  {
    echo 'Jump to page: ';
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
    //$url = $public[$x] ? $links[$x] : "#";
    $url = $links[$x];
    echo '<div class="float">';
    echo '<a href="/'.$url.'">';
    echo '<img src="data:image/png;base64,' . base64_encode($pics[$x]).'" />';
    echo "</a></div>\n";
  }

?>

<div class="spacer">&nbsp;</div>

