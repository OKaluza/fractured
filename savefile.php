<?php
  $data = $_POST['data'];
  $file = $_POST['filename'];
  $type = $_POST['type'];

  if ($type === "png" || $type === "jpeg")
  {
    //removing the "data:image/png;base64," part
    $uri = substr($data,strpos($data,",")+1);
    // decode the data
    $data = base64_decode($uri);
    // Set content type
    $type = 'image/'.$type;
  }

  header("Content-type: " . $type);
  header("Content-length: " . strlen($data));
  header("Content-Disposition: attachment; filename=\"".$file."\"");
    echo $data;
?>
