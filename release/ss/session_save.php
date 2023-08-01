<?php
  include("session.php");
  include("connect.php");

  $user = $_SESSION["user_id"];
  $sessid = $_POST["session_id"];

  if ($user <= 0) {
    echo "NOT LOGGED IN";
    exit();
  }

  $data = $_POST["data"];
  //Compress session text
  $size = strlen($data);
  if ($size > 1000)
    $data = gzencode($data, 9);

  $params = array(
    ':user' => $user,
    ':date' => date("Y-m-d H:i:s"),
    ':data' => $data,
    ':size' => $size
    );

  if (!$sessid)
  {
    $params[':desc'] = $_POST["description"];
    $query = $db->prepare("INSERT INTO session (user_id, date, description, data, size) values(:user, :date, :desc, :data, :size)");
    if (!$query->execute($params))
      die('Invalid query, insert failed');
    //New session inserted, save id
    $sessid = $db->lastInsertId();
  }
  else
  {
    $params[':id'] = $sessid;
    $query = $db->prepare("UPDATE session SET date = :date, data = :data, size = :size WHERE id = :id AND user_id = :user");
    if (!$query->execute($params))
      die('Invalid query, update failed');
  }

  $query->closeCursor();
  $db = null;
  echo $sessid;
  exit();
?>
