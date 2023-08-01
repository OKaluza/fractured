<?php
  include("session.php");
  include("connect.php");

  $fid = $_POST["formulae"];
  $query;
  $params = array(
    ':user' => $_SESSION["user_id"],
    ':date' => date("Y-m-d H:i:s"),
    ':data' => $_POST["data"],
    ':public' => isset($_POST["public"]) ? $_POST["public"] : 0
    );

  if ($params[':user'] <= 0) exit();

  try
  {
    if (!$fid)
    {
      $params[':name'] = $_POST["name"];
      $query = $db->prepare("INSERT INTO formula (user_id, date, name, data, public) values(:user, :date, :name, :data, :public)");
      //If new record inserted, save id
      if ($query->execute($params) && $query->rowCount())
        $fid = $db->lastInsertId();
      else
        die('Insert failed');
    }
    else
    {
      $params[':id'] = $fid;
      $query = $db->prepare("UPDATE formula SET date = :date, data = :data, public = :public WHERE id = :id AND user_id = :user");
      if (!$query->execute($params))
        die('Update failed');
    }
  }
  catch(PDOException $e)
  {
    echo $e->getMessage();
  }

  $query->closeCursor();
  echo $fid;
?>
