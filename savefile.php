<?php
  $data = $_POST['data'];
  $file = $_POST['filename'];
  $type = $_POST['content'];

  header("Content-type: " . $type);
  header("Content-length: " . strlen($data));
  header("Content-Disposition: attachment; filename=\"".$file."\"");

  echo $data;
?>
