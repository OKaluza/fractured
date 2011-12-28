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

  <li><span class="fly" tabindex="1">Saved Sessions</span>
    <ul>
      <li><span onclick="uploadState();">Save</span></li>
      <li><span onclick="loadSelectedState();">Load</span></li>
      <li><span onclick="deleteSelectedState();">Delete</span></li>
      <select size="10" class="savelist" id="sessions" ondblclick="loadSelectedState()">
      </select>
    </ul>
  </li>
  <li><hr></li>
  <li><span onclick="logout();">Logout</span></li>

  <?php
  }
  else
  {
    //No user logged in
  ?>
  <li><span class="fly" tabindex="1">Login with</span>
    <ul class="login">
      <li><span onclick="toggle('openid_form'); $('openid').focus();">
        <img src="media/logos/logo_openid.png" alt="OpenID">
      </span></li>
      <li><span onclick="login('https://www.google.com/accounts/o8/id');">
        <img src="media/logos/logo_google.png" alt="Google">
      </span></li>
      <li><span onclick="login('https://me.yahoo.com');">
        <img src="media/logos/logo_yahoo.png" alt="Yahoo">
      </span></li>
      <li><span onclick="login('http://myopenid.com');">
        <img src="media/logos/logo_myopenid.png" alt="MyOpenID">
      </span></li>
      <li><span onclick="login('http://openid.aol.com');">
        <img src="media/logos/logo_aol.png" alt="AOL">
      </span></li>
      <li><span onclick="login('http://openid.stackexchange.com');">
        <img src="media/logos/logo_stackexchange.png" alt="Stack Exchange">
      </span></li>
    </ul>
  </li>


  <?php
  }
?>
