<?php
session_start();
require 'openid.php';
try 
{
  # Change 'localhost' to your domain name.
  //$openid = new LightOpenID('fractured.ozone.id.au');
  $openid = new LightOpenID('fractured.dev');
  if(!$openid->mode) 
  {
    # The following two lines request email, full name, and a nickname
    # from the provider. Remove them if you don't need that data.
    $openid->required = array('contact/email');
    $openid->optional = array('namePerson', 'namePerson/friendly');

    //Generic login
    if($_POST['provider-url'] === "none" && isset($_POST['openid_identifier']))
    {
      $openid->identity = $_POST['openid_identifier'];
      header('Location: ' . $openid->authUrl());
    }
    //Provider login
    elseif(isset($_POST['provider-url']))
    {
      $openid->identity = $_POST['provider-url'];
      header('Location: ' . $openid->authUrl());
    }
  }
  elseif ($openid->mode == 'cancel')
  {
    echo 'User has canceled authentication!';
  } 
  else 
  {
    if ($openid->validate())
    {
      $attribs = $openid->getAttributes();
      //print_r($attribs);
      $_SESSION['openid'] = $openid->identity;
      $_SESSION['email'] = $attribs['contact/email'];
      $_SESSION['name'] = $attribs['namePerson/friendly'];
      session_regenerate_id();
      header('Location: db/user.php');
    }
    else
      echo 'User has not logged in.';
  }
} 
catch(ErrorException $e) 
{
  echo "ERROR: ";
  echo $e->getMessage();
}
?>
