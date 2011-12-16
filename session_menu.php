<?php
  session_start();

  if (isset($_SESSION['user_id']))
  {
    //User is logged in
  ?> 
  <form name="savesession" action="db/session_save.php" method="post">
    <input type="hidden" id="desc" name="description"/>
    <input type="hidden" id="sessid" name="session_id"/>
  </form>

  <li><a class="fly" tabindex="1" href="#">Saved Sessions</a>
    <ul>
      <li><a href="javascript:uploadState(<?php echo $_SESSION['session_id'];?>);">Save</a></li>
      <li><a href="javascript:loadSelectedState();">Load</a></li>
      <li><a href="javascript:deleteSelectedState();">Delete</a></li>
    <select size="10" style="width: 300px;" class="savelist" id="sessions" ondblclick="loadSelectedState()">
    </select>
    </ul>
  </li>
  <li>----</li>
  <li><a href="javascript:logout();">Logout</a></li>

  <?php
  }
  else
  {
    //No user logged in
  ?>
  <li><a class="fly" tabindex="1" href="#">Login with</a>
    <ul class="login">
      <li><a href="javascript:login();"><img src="media/logos/logo_openid.png" alt="OpenID"></a></li>
      <li><a href="javascript:login('https://www.google.com/accounts/o8/id');"><img src="media/logos/logo_google.png" alt="Google"></a></li>
      <li><a href="javascript:login('https://me.yahoo.com');"><img src="media/logos/logo_yahoo.png" alt="Yahoo"></a></li>
      <li><a href="javascript:login('http://myopenid.com');"><img src="media/logos/logo_myopenid.png" alt="MyOpenID"></a></li>
      <li><a href="javascript:login('http://openid.aol.com');"><img src="media/logos/logo_aol.png" alt="AOL"></a></li>
      <li><a href="javascript:login('http://openid.stackexchange.com');"><img src="media/logos/logo_stackexchange.png" alt="Stack Exchange"></a></li>
    </ul>
  </li>

  <form action="authenticate.php" method="post" name="login">
    <input type="hidden" id="openid" name="openid_url" id="openid"/>
  </form>

  <?php
  }
?>
