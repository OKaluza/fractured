<?php
  // Connect to database...
  include("connect.php");

  // Run query...
  $getFeed = mysql_query("SELECT * FROM fractal WHERE user_id > 0 and public = 1 ORDER BY date DESC;")or die(mysql_error());
  $root = 'http://fractured.ozone.id.au/';

  // Output XML (RSS)
  echo '<?xml version="1.0" encoding="ISO-8859-1" ?>
        <rss version="2.0">
          <channel>
            <title>Recent Fractals</title>
            <link>http://fractured.ozone.id.au/ss/rss.php</link>
            <description>Newly shared fractals</description>
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
                      '<title>', $rssFeed['name'], '</title>',
                      '<link>', $root, $rssFeed['locator'], '</link>',
                      '<description><![CDATA[' ,$rssFeed['name'],$rssFeed['user_id'],']]></description>',
                      '</item>';

          }

      echo '</channel>
      </rss>';
