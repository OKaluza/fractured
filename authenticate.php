<?php
session_start();
require 'openid.php';

function error_msg($msg) {
  echo '<!doctype html><html><head><script language="javascript">alert("';
  echo $msg;
  echo '"); window.location = "/";</script></head></html>';
}

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

    //OpenID login
    $openid->identity = $_POST['openid_url'];
    header('Location: ' . $openid->authUrl());
  }
  elseif ($openid->mode == 'cancel')
  {
    error_msg("OpenID: User has cancelled authentication!");
  } 
  else 
  {
    # Returned from openid authentication, check valid
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
      error_msg("OpenID: User has not logged in!");
  }
} 
catch(ErrorException $e) 
{
  error_msg("OpenID Error: " . $e->getMessage());
}
?>
