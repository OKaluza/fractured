<?php
$filename = basename($_FILES['file']['name']);
$ext = substr($filename, strrpos($filename, '.') + 1);

if (($ext == "ini"))
//&& (($_FILES["file"]["type"] == "text/plain")
//|| ($_FILES["file"]["type"] == "application/octet-stream"))
//&& ($_FILES["file"]["size"] < 200000))
  {
  if ($_FILES["file"]["error"] > 0)
    {
    echo "Return Code: " . $_FILES["file"]["error"] . "<br />";
    }
  else
    {
    echo "Upload: " . $_FILES["file"]["name"] . "<br />";
    echo "Type: " . $_FILES["file"]["type"] . "<br />";
    echo "Size: " . ($_FILES["file"]["size"] / 1024) . " Kb<br />";
    echo "Temp file: " . $_FILES["file"]["tmp_name"] . "<br />";

    $newname = dirname(__FILE__).'/upload/'.$filename;

    if (file_exists($newname))
      {
      echo $newname . " already exists. ";
      }
    else
      {
        //Attempt to move the uploaded file to it's new place
        if ((move_uploaded_file($_FILES['file']['tmp_name'],$newname))) {
           echo "It's done! The file has been saved as: ".$newname;
        } else {
           echo "Error: A problem occurred during file upload!";
        }
      }
    }
  }
else
  {
  echo "Invalid file, extension: $ext, type: " . $_FILES["file"]["type"];
  }
?> 
