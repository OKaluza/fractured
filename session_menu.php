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
      <li><span onclick="uploadState(<?php echo $_SESSION['session_id'];?>);">Save</span></li>
      <li><span onclick="loadSelectedState();">Load</span></li>
      <li><span onclick="deleteSelectedState();">Delete</span></li>
      <select size="10" style="width: 300px;" class="savelist" id="sessions" ondblclick="loadSelectedState()">
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
      <li><span onclick="toggle('openid_form');"><img src="media/logos/logo_openid.png" alt="OpenID"></span></li>
        <li id="openid_form" style="display:none;">
          <input type="text" value="" id="openid_field" style="width: 120px;"></p>
          <span onclick="login($('openid_field').value);" style="color: #666;">Login</span>
        </li>
      <li><span onclick="login('https://www.google.com/accounts/o8/id');"><img src="media/logos/logo_google.png" alt="Google"></span></li>
      <li><span onclick="login('https://me.yahoo.com');"><img src="media/logos/logo_yahoo.png" alt="Yahoo"></span></li>
      <li><span onclick="login('http://myopenid.com');"><img src="media/logos/logo_myopenid.png" alt="MyOpenID"></span></li>
      <li><span onclick="login('http://openid.aol.com');"><img src="media/logos/logo_aol.png" alt="AOL"></span></li>
      <li><span onclick="login('http://openid.stackexchange.com');"><img src="media/logos/logo_stackexchange.png" alt="Stack Exchange"></span></li>
    </ul>
  </li>

  <form action="authenticate.php" method="post" name="login">
    <input type="hidden" id="openid" name="openid_url" id="openid"/>
  </form>

  <?php
  }
?>
