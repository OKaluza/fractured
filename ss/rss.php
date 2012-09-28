<?php
  // Connect to database...
  include("connect.php");

  // Run query...
  $type = $_GET["type"];
  if ($type == "shared")
  {
    $query = "SELECT * FROM fractal WHERE user_id > 0 and public = 1 and type = 0 ORDER BY date DESC;";
    $title = "Recent Fractals";
    $desc = "Newly shared fractals";
  }
  else if ($type == "images")
  {
    $query = "SELECT * FROM fractal WHERE public = 1 and type = 1 ORDER BY date DESC;";
    $title = "Recent Images";
    $desc = "Newly shared images";
  }

  $getFeed = mysql_query($query)or die(mysql_error());
  $root = "http://{$_SERVER['SERVER_NAME']}/";

  // Output XML (RSS)
  echo '<?xml version="1.0" encoding="ISO-8859-1" ?>
        <rss version="2.0">
          <channel>
            <title>' . $title . '</title>
            <link>http://fractured.ozone.id.au/ss/rss.php</link>
            <description>' . $desc . '</description>
            <language>English</language>
            <image>
              <title>website Logo</title>
              <url>http://fractured.ozone.id.au/media/logo.png</url>
              <link>http://fractured.ozone.id.au/</link>
              <width>60</width>
              <height>60</height>
            </image>';

  while($rssFeed = mysql_fetch_array($getFeed)) {
    echo '<item>',
         '<title>', $rssFeed['name'], '</title>';

         '<link>', $root, $rssFeed['locator'], '</link>',
         '<description><![CDATA[' ,$rssFeed['name'],']]></description>',
         '</item>';

  }

  echo '</channel>
        </rss>';
