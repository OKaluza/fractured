<?php
  include("session.php");
  include("connect.php");

  //Always filter by session user id, so can't access another users data with GET url alone
  $user = $_SESSION["user_id"];
  $formulae = $_GET['id'];

  //Retrieve specific ID or list?
  if (isset($formulae))
  {
    $query = $db->prepare("SELECT * FROM formula WHERE (public = 1 OR user_id = :user) AND id = :id");
    if ($query->execute(array(':id' => $formulae, ':user' => $user)) && $query->rowCount())
    {
      $row = $query->fetch(PDO::FETCH_ASSOC);
      //Return the first row result JSON (should only be one)
      echo $row["data"];
    }
  }
  else
  {
    $query = $db->prepare("SELECT * FROM formula WHERE public = 1 OR user_id = :user");
    $query->execute(array(':user' => $user));
    // Fetch each row of the results into array $row
    echo '[';
    $count = 0;
    while ($row = $query->fetch(PDO::FETCH_ASSOC))
    {
      if ($count > 0) echo ',';
      $count++;
      $date = date("Y/m/d", strtotime($row["date"]));
      echo '{"id": "'. $row["id"] . '",';
      echo ' "public": "'. $row["public"] . '",';
      echo ' "date": "'. $date . '",';
      echo ' "name": "'. $row["name"] . '"}';
    }
    echo ']';
  }

  $query->closeCursor();
  $db = null;
?>


