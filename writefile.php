<?php
  $data = $_POST['data'];
  $file = $_POST['filename'];

  $fh = fopen($file, 'w') or die("can't open file: " . $file);
  fwrite($fh, $data);
  fclose($fh);
  echo "File $file sucessfully written";
?>
