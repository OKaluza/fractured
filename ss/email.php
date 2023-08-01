<?php
include("session.php");
  
$myemail = "owen@ozone.id.au";

/* Check all form inputs using check_input function */
$subject = check_input($_POST['subject'], "Enter a subject");
$email = check_input($_POST['email']);
$message = check_input($_POST['message'], "Write your message");

//$captcha = $_POST['captcha'];
//Check captcha
//if ($captcha != $_SESSION['captcha'])  $error = "Please enter the validation sum displayed correctly.";
  
//Validate email
if (!empty($email))
{
  //Split given email address into username and domain.
  list($userName, $mailDomain) = explode("@", $email);

  
  if (empty($userName) || empty($mailDomain))
  {
    $error = "Invalid email address";
  }
  else
  {
    //Check for DNS error on MX record
    if (!checkdnsrr($mailDomain, "MX"))
    {
      // this email domain doesn't exist! 
      $error = "Invalid email address domain";
    }
  }
}

//Prevent email address injection
if (preg_match( "[\r\n]", $email ) ) 
  $error = "Invalid characters in name or email.";

//Write entry form data to text file for logging
$filename = "formlog.txt";
$today = date("F j, Y, g:i a");
$logmessage = "Form submit attempt on $today, Subject: $subject, Email: $email, Message: $message";

if (isset($error))
{
  $logmessage = "ERROR(" . $error . ") -- " . $logmessage;
  $filename = "faillog.txt";
}
$logmessage = $logmessage . "\n";

// Make sure the file exists and is writable first.
if (!file_exists($filename) || is_writable($filename)) 
{
  // Open $filename in append mode.
  if ($handle = fopen($filename, 'a'))
  {
    fwrite($handle, $logmessage);
    fclose($handle);
  }
} 

if (isset($error))
{
  echo $error;
}
else 
{
  $message = $message . "\n------------------------------------------\n" . print_r($_SESSION, true);
  mail($myemail, $subject . " " . $email,
       $message, "From: $email");
  
  echo "Email sent, thanks!";
}

function check_input($data, $problem='')
{
  $data = trim($data);
  $data = stripslashes($data);
  $data = htmlspecialchars($data);
  if ($problem && strlen($data) == 0)
  {
    echo $problem;
    exit();
  }
  return $data;
}

?>
