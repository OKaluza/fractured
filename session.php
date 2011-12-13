<?php
  session_start();

  if (isset($_SESSION['user_id']))
  {
    //User is logged in
  ?> 
  <form action="logout.php" method="post" class="login">
    <p>Welcome <b><?php echo $_SESSION['name'];?></b>
    <!--p>USER_ID: <?php echo $_SESSION['user_id'];?>, SESSION_ID: <?php echo $_SESSION['session_id'];?></p>
    <p><?php echo $_SESSION['error'];?></p-->
    <input class="right" type="submit" value="Logout" onclick="delete localStorage['fractured.currentLogin']; delete localStorage['fractured.currentSession']"/></p>
    <div class="clear"></div>
  </form>
  <div class="gap"></div>
  <form name="savesession" action="db/session_save.php" method="post">
    <input type="hidden" id="desc" name="description"/>
    <input type="hidden" id="sessid" name="session_id"/>
  </form>
  <div class="gap"></div>
  <p><i><b>Sessions:</b></i></p>
  <input type="button" onclick="uploadState(<?php echo $_SESSION['session_id'];?>);" value="Save"/>
  <input type="button" onclick="loadSelectedState();" value="Load"/>
  <input type="button" onclick="deleteSelectedState();" value="Delete"/>
  <select size="20" class="savelist" id="sessions" ondblclick="loadSelectedState()">
  </select>
  <br>

  <?php
  }
  else
  {
    //No user logged in
  ?>

  <form action="authenticate.php?login" method="post" class="login">
    <p>Login with</p>
    <input type="submit" name="submit" value="Login" class="right" >
    <select name="provider-url" onchange="$S('openid').display = (this.value=='none') ? 'block' : 'none';">
      <option value="https://www.google.com/accounts/o8/id">Google</option>
      <option value="https://me.yahoo.com">Yahoo</option>
      <option value="http://myopenid.com">MyOpenId</option>
      <option value="http://openid.stackexchange.com">StackExchange</option>
      <option value="none">Entered OpenID...</option>
    </select><br>
    <input type="text" id="openid" name="openid_identifier" style="display: none;"/>
    <div class="clear"></div>
  </form>
  <div class="gap"></div>

  <?php
  }
?>
