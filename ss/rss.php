<?php
  // Connect to database...
  include("connect.php");

  // Run query...
  $root = "http://{$_SERVER['SERVER_NAME']}/";
  $type = $_GET["type"];
  if ($type == "shared")
  {
    $query = "SELECT name,locator FROM fractal WHERE user_id > 0 and public = 1 ORDER BY date DESC;";
    $title = "Recent Fractals";
    $desc = "Newly shared fractals";
  }
  else if ($type == "images")
  {
    $query = "SELECT name,url FROM image ORDER BY date DESC;";
    $title = "Recent Images";
    $desc = "Newly shared images";
  }

  $getFeed = $mysql->query($query)or die($mysql->error());

  // Output XML (RSS)
  echo '<?xml version="1.0" encoding="ISO-8859-1" ?>
        <rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
          <channel>
            <title>' . $title . '</title>
            <link>' . $root . 'rss.php?type=' . $type . '</link>
            <description>' . $desc . '</description>
            <language>en-uk</language>
            <image>
              <title>' . $title . '</title>
              <url>' . $root . 'media/logo.png</url>
              <link>' . $root . 'rss.php?type=' . $type . '</link>
              <width>60</width>
              <height>60</height>
            </image>';

  echo "\n<atom:link href='{$root}rss.php?type={$type}' rel='self' type='application/rss+xml' />\n";

  while($rssFeed = $getFeed->fetch_array()) {
    if ($type == "shared")
      $link = $root . $rssFeed['locator'];
    else if ($type == "images")
      $link = $rssFeed['url'];

    $name = htmlspecialchars($rssFeed['name']);

    echo "<item>\n",
         "<title>{$name}</title>\n",
         "<link>$link</link>\n",
         "<guid>$link</guid>\n",
         "<description><![CDATA[{$name}]]></description>\n",
         "</item>\n";
  }
  echo "</channel></rss>";
